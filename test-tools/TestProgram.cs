using System;
using System.IO;
using System.Threading.Tasks;

namespace TestApp
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Empty catch block - should trigger error
            try
            {
                DoSomething();
            }
            catch
            {
                // Silent error swallowing
            }

            // Deep nesting - should trigger error
            if (true)
            {
                if (true)
                {
                    if (true)
                    {
                        if (true)
                        {
                            if (true)
                            {
                                if (true)
                                {
                                    Console.WriteLine("Too deep!");
                                }
                            }
                        }
                    }
                }
            }

            // Unhandled async - should trigger error
            var task = DoAsync();
            
            // IDisposable not disposed - should trigger error
            var stream = new FileStream("test.txt", FileMode.Open);
            // Missing using statement or Dispose call
            
            // String concatenation - should trigger warning
            var message = "Hello" + " " + "World" + "!";
            
            Console.WriteLine(message);
        }

        public static void DoSomething()
        {
            Console.WriteLine("Doing something");
        }

        public static async Task DoAsync()
        {
            await Task.Delay(1000);
        }
    }
}
