/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiRequestOptions } from './ApiRequestOptions';
import type { ApiResult } from './ApiResult';

export class ApiError extends Error {
    public readonly url: string;
    public readonly status: number;
    public readonly statusText: string;
    public readonly body: any;
    public readonly request: ApiRequestOptions;

    constructor(request: ApiRequestOptions, response: ApiResult, message: string) {
        super(message);

        this.name = 'ApiError';
        this.url = response.url;
        this.status = response.status;
        this.statusText = response.statusText;
        this.body = response.body;
        this.request = request;
    }

    extractErrorMessage(): string {
        const body = this.body;

        if (typeof body === "string" && body.trim()) {
            return body;
        }

        if (
            body &&
            typeof body === "object" &&
            typeof (body as { message?: unknown }).message === "string" &&
            (body as { message: string }).message.trim()
        ) {
            return (body as { message: string }).message;
        }

        return "Could not create the booking. Please try again.";
    }
}
