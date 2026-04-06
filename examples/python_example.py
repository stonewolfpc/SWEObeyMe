# Example Python code demonstrating various patterns
import os
import sys
from typing import List, Optional
import json
import threading

class DataProcessor:
    """A class for processing data with various anti-patterns."""
    
    def __init__(self, name: str):
        self.name = name
        self.data: List[int] = []
        self._lock = threading.Lock()
    
    def add_value(self, value: int) -> None:
        """Add a value to the data list."""
        with self._lock:
            self.data.append(value)
    
    # Empty catch block - anti-pattern
    def risky_operation(self) -> None:
        """Operation with silent exception handling."""
        try:
            if not self.data:
                raise ValueError("No data available")
            # Process data
        except Exception:
            # Silent catch - bad practice
            pass
    
    # Deep nesting example
    def complex_logic(self) -> None:
        """Complex nested logic that's hard to read."""
        if self.data:
            for i, value in enumerate(self.data):
                if value > 0:
                    for j in range(10):
                        if value % 2 == 0:
                            for k in range(5):
                                # Very deep nesting
                                print(f"{value} * {j} * {k} = {value * j * k}")
    
    # Resource leak example
    def file_operation_leak(self, filepath: str) -> None:
        """File operation with potential resource leak."""
        f = open(filepath, 'r')  # Missing close()
        try:
            content = f.read()
            # Process content
        finally:
            # Missing f.close() in finally block
            pass
    
    # Proper resource management with context manager
    def file_operation_safe(self, filepath: str) -> Optional[str]:
        """File operation with proper resource management."""
        try:
            with open(filepath, 'r') as f:
                return f.read()
        except FileNotFoundError:
            return None
    
    # String concatenation issue
    def string_concat_issue(self, base: str) -> str:
        """Inefficient string concatenation in loop."""
        result = base
        for i in range(1000):
            result += "append"  # Inefficient
        return result
    
    # Better approach using join
    def string_concat_safe(self, base: str) -> str:
        """Efficient string concatenation."""
        parts = [base] + ["append"] * 1000
        return "".join(parts)
    
    # Null reference risk
    def get_first_item(self) -> Optional[int]:
        """Returns first item or None if empty."""
        if not self.data:
            return None
        return self.data[0]
    
    # Missing type checking
    def process_item(self, item) -> int:
        """Process an item without type checking."""
        return item * 2  # Could fail if item is not numeric

# Global state mutation - anti-pattern
global_counter = 0

def increment_global() -> int:
    """Mutates global state."""
    global global_counter
    global_counter += 1
    return global_counter

# Async/await example
import asyncio

async def async_fetch_data(url: str) -> dict:
    """Async function to fetch data."""
    # Simulate async operation
    await asyncio.sleep(0.1)
    return {"url": url, "data": "sample"}

# Missing await
async def bad_async_call() -> None:
    """Async function missing await."""
    async_fetch_data("https://example.com")  # Missing await

# Proper async call
async def good_async_call() -> None:
    """Async function with proper await."""
    result = await async_fetch_data("https://example.com")
    print(result)

# Division by zero risk
def calculate_ratio(numerator: int, denominator: int) -> float:
    """Calculate ratio with division by zero risk."""
    return numerator / denominator  # Could raise ZeroDivisionError

# Safe division
def calculate_ratio_safe(numerator: int, denominator: int) -> Optional[float]:
    """Calculate ratio safely."""
    if denominator == 0:
        return None
    return numerator / denominator

# Main execution
if __name__ == "__main__":
    processor = DataProcessor("Example")
    processor.add_value(10)
    processor.add_value(20)
    processor.add_value(30)
    
    processor.risky_operation()
    processor.complex_logic()
    
    # Run async example
    asyncio.run(good_async_call())
