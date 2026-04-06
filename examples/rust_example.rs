// Example Rust code demonstrating various patterns
use std::fs::File;
use std::io::{self, BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};
use std::thread;

pub struct DataProcessor {
    name: String,
    data: Arc<Mutex<Vec<i32>>>,
}

impl DataProcessor {
    pub fn new(name: String) -> Self {
        DataProcessor {
            name,
            data: Arc::new(Mutex::new(Vec::new())),
        }
    }
    
    pub fn add_value(&self, value: i32) {
        let mut data = self.data.lock().unwrap();
        data.push(value);
    }
    
    // Empty match - anti-pattern
    pub fn risky_operation(&self) {
        let data = self.data.lock().unwrap();
        if data.is_empty() {
            panic!("No data available");
        }
        // Process data
    }
    
    // Deep nesting example
    pub fn complex_logic(&self) {
        let data = self.data.lock().unwrap();
        if !data.is_empty() {
            for i in 0..data.len() {
                let value = data[i];
                if value > 0 {
                    for j in 0..10 {
                        if value % 2 == 0 {
                            for k in 0..5 {
                                // Very deep nesting
                                println!("{}", value * j * k);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Resource leak example (Rust prevents this, but here's the pattern)
    pub fn file_operation_leak(&self, filepath: &str) -> io::Result<()> {
        let file = File::open(filepath)?;
        let reader = BufReader::new(file);
        
        for line in reader.lines() {
            let line = line?;
            // Process line
        }
        // Rust automatically closes file when it goes out of scope
        Ok(())
    }
    
    // Proper resource management with RAII
    pub fn file_operation_safe(&self, filepath: &str) -> io::Result<String> {
        let file = File::open(filepath)?;
        let reader = BufReader::new(file);
        
        let mut result = String::new();
        for line in reader.lines() {
            result.push_str(&line?);
            result.push('\n');
        }
        Ok(result)
    }
    
    // String concatenation issue
    pub fn string_concat_issue(&self, base: &str) -> String {
        let mut result = base.to_string();
        for _ in 0..1000 {
            result.push_str("append"); // Inefficient
        }
        result
    }
    
    // Better approach using String with capacity
    pub fn string_concat_safe(&self, base: &str) -> String {
        let mut result = String::with_capacity(base.len() + 6000);
        result.push_str(base);
        for _ in 0..1000 {
            result.push_str("append");
        }
        result
    }
    
    // Option for null safety
    pub fn get_first_item(&self) -> Option<i32> {
        let data = self.data.lock().unwrap();
        data.first().copied()
    }
    
    // Async/await example
    pub async fn async_fetch_data(&self, url: &str) -> String {
        // Simulate async operation
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        format!("{{\"url\":\"{}\",\"data\":\"sample\"}}", url)
    }
    
    // Division by zero risk
    pub fn calculate_ratio(&self, numerator: i32, denominator: i32) -> f64 {
        numerator as f64 / denominator as f64 // Could panic if denominator is 0
    }
    
    // Safe division
    pub fn calculate_ratio_safe(&self, numerator: i32, denominator: i32) -> Option<f64> {
        if denominator == 0 {
            return None;
        }
        Some(numerator as f64 / denominator as f64)
    }
    
    // Concurrency example
    pub fn concurrent_processing(&self) {
        let data = Arc::clone(&self.data);
        
        let handle = thread::spawn(move || {
            let data = data.lock().unwrap();
            let sum: i32 = data.iter().sum();
            sum
        });
        
        let result = handle.join().unwrap();
        println!("Sum: {}", result);
    }
}

fn main() {
    let processor = DataProcessor::new("Example".to_string());
    processor.add_value(10);
    processor.add_value(20);
    processor.add_value(30);
    
    processor.risky_operation();
    processor.complex_logic();
    
    // Async example (requires tokio runtime)
    #[tokio::main]
    async fn async_example() {
        let processor = DataProcessor::new("Example".to_string());
        let result = processor.async_fetch_data("https://example.com").await;
        println!("{}", result);
    }
}
