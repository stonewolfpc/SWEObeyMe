// Example TypeScript code demonstrating various patterns
interface DataItem {
    id: number;
    value: number;
}

class DataProcessor {
    private name: string;
    private data: number[];
    private lock: Promise<void> = Promise.resolve();

    constructor(name: string) {
        this.name = name;
        this.data = [];
    }

    async addValue(value: number): Promise<void> {
        await this.lock;
        this.lock = (async () => {
            this.data.push(value);
        })();
        await this.lock;
    }

    // Empty catch block - anti-pattern
    async riskyOperation(): Promise<void> {
        try {
            if (this.data.length === 0) {
                throw new Error("No data available");
            }
            // Process data
        } catch (error) {
            // Silent catch - bad practice
        }
    }

    // Deep nesting example
    complexLogic(): void {
        if (this.data.length > 0) {
            for (let i = 0; i < this.data.length; i++) {
                const value = this.data[i];
                if (value > 0) {
                    for (let j = 0; j < 10; j++) {
                        if (value % 2 === 0) {
                            for (let k = 0; k < 5; k++) {
                                // Very deep nesting
                                console.log(value * j * k);
                            }
                        }
                    }
                }
            }
        }
    }

    // Resource leak example (TypeScript doesn't have direct file I/O, but here's the pattern)
    async fileOperationLeak(filepath: string): Promise<string> {
        // In a real scenario with Node.js fs
        // const fs = require('fs').promises;
        // const handle = await fs.open(filepath, 'r');
        // Missing handle.close();
        return "simulated content";
    }

    // String concatenation issue
    stringConcatIssue(base: string): string {
        let result = base;
        for (let i = 0; i < 1000; i++) {
            result += "append"; // Inefficient
        }
        return result;
    }

    // Better approach using array join
    stringConcatSafe(base: string): string {
        const parts = [base];
        for (let i = 0; i < 1000; i++) {
            parts.push("append");
        }
        return parts.join("");
    }

    // Null/undefined reference risk
    getFirstItem(): number | undefined {
        if (this.data.length === 0) {
            return undefined;
        }
        return this.data[0];
    }

    // Async/await example
    async asyncFetchData(url: string): Promise<DataItem> {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        return { id: 1, value: 42 };
    }

    // Missing await
    async badAsyncCall(): Promise<void> {
        this.asyncFetchData("https://example.com"); // Missing await
    }

    // Proper async call
    async goodAsyncCall(): Promise<void> {
        const result = await this.asyncFetchData("https://example.com");
        console.log(result);
    }

    // Division by zero risk
    calculateRatio(numerator: number, denominator: number): number {
        return numerator / denominator; // Could return NaN or Infinity
    }

    // Safe division
    calculateRatioSafe(numerator: number, denominator: number): number | null {
        if (denominator === 0) {
            return null;
        }
        return numerator / denominator;
    }

    // Type safety example
    processItem(item: unknown): number {
        if (typeof item === "number") {
            return item * 2;
        }
        throw new Error("Item must be a number");
    }

    // Generic type example
    map<T, U>(array: T[], fn: (item: T) => U): U[] {
        return array.map(fn);
    }

    // Promise.all example
    async fetchMultiple(urls: string[]): Promise<DataItem[]> {
        const promises = urls.map(url => this.asyncFetchData(url));
        return Promise.all(promises);
    }
}

// Global state mutation - anti-pattern
let globalCounter = 0;

function incrementGlobal(): number {
    globalCounter++;
    return globalCounter;
}

// Functional programming example
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const filtered = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

// Main execution
async function main(): Promise<void> {
    const processor = new DataProcessor("Example");
    await processor.addValue(10);
    await processor.addValue(20);
    await processor.addValue(30);

    await processor.riskyOperation();
    processor.complexLogic();

    await processor.goodAsyncCall();
}

main().catch(console.error);
