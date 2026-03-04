export class Cell {
  constructor(
    private readonly ix: number,
    private value: string,
    private readonly orig: boolean = true,
  ) {}
  getValue(): string {
    return this.value;
  }
  setValue(value: string): void {
    this.value = value;
  }
}
