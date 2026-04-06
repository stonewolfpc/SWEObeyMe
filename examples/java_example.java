// Example Java code demonstrating various patterns
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;

public class DataProcessor {
    private String name;
    private List<Integer> data;
    private final Object lock = new Object();
    
    public DataProcessor(String name) {
        this.name = name;
        this.data = new ArrayList<>();
    }
    
    public void addValue(int value) {
        synchronized (lock) {
            data.add(value);
        }
    }
    
    // Empty catch block - anti-pattern
    public void riskyOperation() {
        try {
            if (data.isEmpty()) {
                throw new RuntimeException("No data available");
            }
            // Process data
        } catch (Exception e) {
            // Silent catch - bad practice
        }
    }
    
    // Deep nesting example
    public void complexLogic() {
        if (!data.isEmpty()) {
            for (int i = 0; i < data.size(); i++) {
                int value = data.get(i);
                if (value > 0) {
                    for (int j = 0; j < 10; j++) {
                        if (value % 2 == 0) {
                            for (int k = 0; k < 5; k++) {
                                // Very deep nesting
                                System.out.println(value * j * k);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Resource leak example
    public void fileOperationLeak(String filepath) {
        BufferedReader reader = null;
        try {
            reader = new BufferedReader(new FileReader(filepath));
            String line;
            while ((line = reader.readLine()) != null) {
                // Process line
            }
            // Missing reader.close() in finally block
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    
    // Proper resource management with try-with-resources
    public String fileOperationSafe(String filepath) {
        try (BufferedReader reader = new BufferedReader(new FileReader(filepath))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
            return sb.toString();
        } catch (IOException e) {
            return null;
        }
    }
    
    // String concatenation issue
    public String stringConcatIssue(String base) {
        String result = base;
        for (int i = 0; i < 1000; i++) {
            result += "append"; // Inefficient
        }
        return result;
    }
    
    // Better approach using StringBuilder
    public String stringConcatSafe(String base) {
        StringBuilder sb = new StringBuilder(base);
        for (int i = 0; i < 1000; i++) {
            sb.append("append");
        }
        return sb.toString();
    }
    
    // Null reference risk
    public Integer getFirstItem() {
        if (data.isEmpty()) {
            return null;
        }
        return data.get(0);
    }
    
    // Missing null check
    public void processItem(Integer item) {
        int result = item * 2; // Could throw NullPointerException
        System.out.println(result);
    }
    
    // Async/await equivalent with CompletableFuture
    public CompletableFuture<String> asyncFetchData(String url) {
        return CompletableFuture.supplyAsync(() -> {
            // Simulate async operation
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return "{\"url\":\"" + url + "\",\"data\":\"sample\"}";
        });
    }
    
    // Division by zero risk
    public double calculateRatio(int numerator, int denominator) {
        return (double) numerator / denominator; // Could throw ArithmeticException
    }
    
    // Safe division
    public Optional<Double> calculateRatioSafe(int numerator, int denominator) {
        if (denominator == 0) {
            return Optional.empty();
        }
        return Optional.of((double) numerator / denominator);
    }
    
    // Static mutation - anti-pattern
    private static int globalCounter = 0;
    
    public static int incrementGlobal() {
        globalCounter++;
        return globalCounter;
    }
    
    public static void main(String[] args) {
        DataProcessor processor = new DataProcessor("Example");
        processor.addValue(10);
        processor.addValue(20);
        processor.addValue(30);
        
        processor.riskyOperation();
        processor.complexLogic();
        
        // Async example
        CompletableFuture<String> future = processor.asyncFetchData("https://example.com");
        future.thenAccept(System.out::println);
        
        // Wait for async to complete
        try {
            future.get();
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }
    }
}
