// Example Go code demonstrating various patterns
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"sync"
)

type DataProcessor struct {
	name string
	data []int
	mu   sync.Mutex
}

func NewDataProcessor(name string) *DataProcessor {
	return &DataProcessor{
		name: name,
		data: make([]int, 0),
	}
}

func (dp *DataProcessor) AddValue(value int) {
	dp.mu.Lock()
	defer dp.mu.Unlock()
	dp.data = append(dp.data, value)
}

// Empty catch - anti-pattern (Go uses error returns, not exceptions)
func (dp *DataProcessor) RiskyOperation() error {
	if len(dp.data) == 0 {
		return fmt.Errorf("no data available")
	}
	// Process data
	return nil
}

// Deep nesting example
func (dp *DataProcessor) ComplexLogic() {
	dp.mu.Lock()
	defer dp.mu.Unlock()
	
	if len(dp.data) > 0 {
		for _, value := range dp.data {
			if value > 0 {
				for j := 0; j < 10; j++ {
					if value%2 == 0 {
						for k := 0; k < 5; k++ {
							// Very deep nesting
							fmt.Println(value * j * k)
						}
					}
				}
			}
		}
	}
}

// Resource leak example
func (dp *DataProcessor) FileOperationLeak(filepath string) error {
	file, err := os.Open(filepath)
	if err != nil {
		return err
	}
	// Missing file.Close()
	
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		// Process line
	}
	return scanner.Err()
}

// Proper resource management with defer
func (dp *DataProcessor) FileOperationSafe(filepath string) (string, error) {
	file, err := os.Open(filepath)
	if err != nil {
		return "", err
	}
	defer file.Close()
	
	var result string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		result += scanner.Text() + "\n"
	}
	return result, scanner.Err()
}

// String concatenation issue
func (dp *DataProcessor) StringConcatIssue(base string) string {
	result := base
	for i := 0; i < 1000; i++ {
		result += "append" // Inefficient
	}
	return result
}

// Better approach using strings.Builder
func (dp *DataProcessor) StringConcatSafe(base string) string {
	var builder strings.Builder
	builder.WriteString(base)
	for i := 0; i < 1000; i++ {
		builder.WriteString("append")
	}
	return builder.String()
}

// Null reference risk (Go uses nil)
func (dp *DataProcessor) GetFirstItem() *int {
	dp.mu.Lock()
	defer dp.mu.Unlock()
	
	if len(dp.data) == 0 {
		return nil
	}
	return &dp.data[0]
}

// Division by zero risk
func (dp *DataProcessor) CalculateRatio(numerator, denominator int) (float64, error) {
	if denominator == 0 {
		return 0, fmt.Errorf("division by zero")
	}
	return float64(numerator) / float64(denominator), nil
}

// Concurrency example with goroutines
func (dp *DataProcessor) ConcurrentProcessing() {
	dp.mu.Lock()
	data := make([]int, len(dp.data))
	copy(data, dp.data)
	dp.mu.Unlock()
	
	var wg sync.WaitGroup
	results := make(chan int, len(data))
	
	for _, value := range data {
		wg.Add(1)
		go func(v int) {
			defer wg.Done()
			results <- v * 2
		}(value)
	}
	
	go func() {
		wg.Wait()
		close(results)
	}()
	
	for result := range results {
		fmt.Println(result)
	}
}

// Channel example
func ProcessWithChannel(input <-chan int, output chan<- int) {
	for value := range input {
		output <- value * 2
	}
	close(output)
}

func main() {
	processor := NewDataProcessor("Example")
	processor.AddValue(10)
	processor.AddValue(20)
	processor.AddValue(30)
	
	err := processor.RiskyOperation()
	if err != nil {
		fmt.Println("Error:", err)
	}
	
	processor.ComplexLogic()
	
	// Channel example
	input := make(chan int, 3)
	output := make(chan int, 3)
	
	go ProcessWithChannel(input, output)
	
	input <- 10
	input <- 20
	input <- 30
	close(input)
	
	for result := range output {
		fmt.Println(result)
	}
}
