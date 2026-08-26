export class TimeInterval {
  readonly start: Date;
  readonly end: Date;

  constructor(start: string | Date, end: string | Date) {
    this.start = new Date(start);
    this.end = new Date(end);

    if (
      Number.isNaN(this.start.getTime()) ||
      Number.isNaN(this.end.getTime()) ||
      this.start.getTime() >= this.end.getTime()
    ) {
      throw new RangeError(
        'A time interval must have a valid start before its end',
      );
    }
  }

  intersects(other: TimeInterval): boolean {
    return (
      this.start.getTime() < other.end.getTime() &&
      other.start.getTime() < this.end.getTime()
    );
  }
}
