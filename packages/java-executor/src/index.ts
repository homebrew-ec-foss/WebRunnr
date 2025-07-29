export class JavaExecutor {
  private compiler: any;
  private isInitialized = false;
  private load: (module: string | Uint8Array) => Promise<any>;

  constructor(loadFn: (module: string | Uint8Array) => Promise<any>) {
    this.load = loadFn;
  }

  async initialize(
    wasmUrl: string,
    compileClasslibUrl: string,
    runtimeClasslibUrl: string,
  ): Promise<void> {
    if (this.isInitialized) {
      //console.log("✅ Executor already initialized");
      return;
    }

    try {
      //console.log("⚙️ Initializing Java Executor...");
      const result = await this.load(wasmUrl);
      this.compiler = result.exports.createCompiler();

      const [compileLibResponse, runtimeLibResponse] = await Promise.all([
        fetch(compileClasslibUrl),
        fetch(runtimeClasslibUrl),
      ]);

      if (!compileLibResponse.ok || !runtimeLibResponse.ok) {
        throw new Error("Failed to fetch required class libraries");
      }

      const compileLibData = new Int8Array(await compileLibResponse.arrayBuffer());
      const runtimeLibData = new Int8Array(await runtimeLibResponse.arrayBuffer());

      this.compiler.setSdk(compileLibData);
      this.compiler.setTeaVMClasslib(runtimeLibData);
      
      this.isInitialized = true;
      //console.log("✅ Java Executor initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Java Executor:", error);
      throw error;
    }
  }

  async executeCode(javaCode: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error("The executor must be initialized by calling initialize() first");
    }

    //console.log("🚀 Starting compilation and execution...");
    
    this.compiler.addSourceFile("Main.java", javaCode);

    const compileSuccess = this.compiler.compile();
    if (!compileSuccess) {
      throw new Error("Compilation failed: Kindly check your Java code for errors");
    }
    //console.log("✅ Code compiled successfully");

    this.compiler.generateWebAssembly({
      outputName: "app",
      mainClass: "Main",
    });
    const generatedWasm = this.compiler.getWebAssemblyOutputFile("app.wasm");

    if (!generatedWasm) {
      throw new Error("Failed to generate WebAssembly output from compiled code");
    }
    //console.log("✅ WebAssembly binary generated!");

    const userApp = await this.load(generatedWasm);
    if (!userApp.exports.main) {
        throw new Error("Execution failed: Missing the main method in the WebAssembly module");
    }

    const originalLog = console.log;
    let wasmOutput = "";
    console.log = (...args: any[]) => {
      wasmOutput += args.join(" ") + "\n";
      //originalLog.apply(console, args); this line is responsible for printing the output to the console
    };
    
    try {
        userApp.exports.main([]);
    } finally {
        console.log = originalLog;
    }

    //console.log("✅ Execution finished");
    return wasmOutput.trim() || "No output from the main method";
  }
}