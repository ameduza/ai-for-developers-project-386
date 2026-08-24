import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const typeSpecDirectory = resolve(scriptDirectory, "..");
const repositoryDirectory = resolve(typeSpecDirectory, "..");
const outputPath = resolve(repositoryDirectory, "server/src/generated/api-models.ts");
const modelNames = [
  "Owner",
  "BookingType",
  "CreateBookingType",
  "TimeSlot",
  "Guest",
  "Booking",
  "CreateBooking",
  "ErrorCode",
  "Error",
];

function referenceName(reference) {
  return reference.split("/").at(-1);
}

function typeFromContractModel(model) {
  if (model.$ref) return referenceName(model.$ref);
  if (model.enum) return model.enum.map((value) => JSON.stringify(value)).join(" | ");
  if (model.type === "array") return `${typeFromContractModel(model.items)}[]`;
  if (model.type === "string") return "string";
  if (model.type === "integer" || model.type === "number") return "number";
  if (model.type === "boolean") return "boolean";
  throw new Error(`Unsupported API Contract model: ${JSON.stringify(model)}`);
}

function renderModels(openApiDocument) {
  const contractModels = openApiDocument.components?.schemas;
  if (!contractModels) throw new Error("The API Contract did not emit component models.");

  const declarations = modelNames.map((name) => {
    const model = contractModels[name];
    if (!model) throw new Error(`The API Contract is missing the ${name} model.`);
    if (model.enum) {
      return [
        `export type ${name} =`,
        ...model.enum.map(
          (value, index) =>
            `  | ${JSON.stringify(value)}${index === model.enum.length - 1 ? ";" : ""}`,
        ),
      ].join("\n");
    }

    const required = new Set(model.required ?? []);
    const properties = Object.entries(model.properties ?? {}).map(
      ([propertyName, propertyModel]) =>
        `  ${propertyName}${required.has(propertyName) ? "" : "?"}: ${typeFromContractModel(propertyModel)};`,
    );
    return `export interface ${name} {\n${properties.join("\n")}\n}`;
  });

  return [
    "// Generated from typespec/main.tsp. Do not edit directly.",
    "",
    declarations.join("\n\n"),
    "",
  ].join("\n");
}

async function generateModels() {
  const temporaryOutputDirectory = await mkdtemp(join(tmpdir(), "booking-contract-models-"));
  try {
    const compiler = resolve(repositoryDirectory, "node_modules/@typespec/compiler/cmd/tsp.js");
    const result = spawnSync(
      process.execPath,
      [compiler, "compile", typeSpecDirectory, "--output-dir", temporaryOutputDirectory],
      { cwd: typeSpecDirectory, encoding: "utf8" },
    );
    if (result.status !== 0) {
      process.stderr.write(result.stderr);
      throw new Error("TypeSpec compilation failed.");
    }

    const openApi = JSON.parse(
      await readFile(join(temporaryOutputDirectory, "schema/openapi.json"), "utf8"),
    );
    return renderModels(openApi);
  } finally {
    await rm(temporaryOutputDirectory, { force: true, recursive: true });
  }
}

const generatedModels = await generateModels();
if (process.argv.includes("--check")) {
  let committedModels;
  try {
    committedModels = await readFile(outputPath, "utf8");
  } catch {
    console.error("Server API Contract models are missing. Run npm run generate:models --workspace server.");
    process.exitCode = 1;
  }

  if (committedModels !== undefined && committedModels !== generatedModels) {
    console.error("Server API Contract models are stale. Run npm run generate:models --workspace server.");
    process.exitCode = 1;
  }
} else {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, generatedModels, "utf8");
}
