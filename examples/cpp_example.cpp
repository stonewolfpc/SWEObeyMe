// Example C++ code demonstrating various patterns
#include <iostream>
#include <vector>
#include <string>
#include <memory>
#include <algorithm>

class DataProcessor {
private:
    std::vector<int> data;
    std::string name;

public:
    DataProcessor(const std::string& n) : name(n) {}
    
    void addValue(int value) {
        data.push_back(value);
    }
    
    // Potential memory leak if not managed properly
    int* processArray(int size) {
        int* arr = new int[size]; // Missing delete[]
        for (int i = 0; i < size; i++) {
            arr[i] = data[i] * 2;
        }
        return arr;
    }
    
    // Better approach using smart pointer
    std::unique_ptr<int[]> processArraySafe(int size) {
        auto arr = std::make_unique<int[]>(size);
        for (int i = 0; i < size; i++) {
            arr[i] = data[i] * 2;
        }
        return arr;
    }
    
    // Empty catch block - anti-pattern
    void riskyOperation() {
        try {
            if (data.empty()) {
                throw std::runtime_error("No data available");
            }
            // Process data
        } catch (...) {
            // Silent catch - bad practice
        }
    }
    
    // Deep nesting example
    void complexLogic() {
        if (!data.empty()) {
            for (size_t i = 0; i < data.size(); i++) {
                if (data[i] > 0) {
                    for (int j = 0; j < 10; j++) {
                        if (data[i] % 2 == 0) {
                            for (int k = 0; k < 5; k++) {
                                // Very deep nesting
                                std::cout << data[i] * j * k << std::endl;
                            }
                        }
                    }
                }
            }
        }
    }
};

// Resource leak example
void resourceLeakExample() {
    FILE* file = fopen("data.txt", "r"); // Missing fclose
    if (file) {
        char buffer[1024];
        while (fgets(buffer, sizeof(buffer), file)) {
            // Process file content
        }
        // Missing fclose(file);
    }
}

// String concatenation issue
void stringConcatIssue(const std::string& base) {
    std::string result = base;
    for (int i = 0; i < 1000; i++) {
        result += "append"; // Inefficient string concatenation
    }
}

int main() {
    DataProcessor processor("Example");
    processor.addValue(10);
    processor.addValue(20);
    processor.addValue(30);
    
    // Usage examples
    int* arr = processor.processArray(3);
    // Missing delete[] arr;
    
    processor.riskyOperation();
    processor.complexLogic();
    
    return 0;
}
