import * as ts from 'typescript';
/**
 * AST Utility Functions
 *
 * Provides TypeScript Compiler API utilities for AST analysis,
 * declaration extraction, and structural validation.
 *
 * This module uses ONLY the TypeScript compiler API - no regex allowed.
 */
export class AstUtils {
    /**
     * Create a TypeScript SourceFile from code string
     *
     * @param code - Source code to parse
     * @param fileName - Optional filename for error reporting
     * @returns Parsed AST SourceFile
     */
    static createSourceFile(code, fileName = 'temp.ts') {
        return ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, // setParentNodes
        ts.ScriptKind.TS);
    }
    /**
     * Extract top-level declarations from a SourceFile
     *
     * @param sourceFile - Parsed AST
     * @returns Object containing classes, interfaces, functions, and variables
     */
    static getTopLevelDeclarations(sourceFile) {
        const result = {
            classes: [],
            interfaces: [],
            functions: [],
            variables: [],
        };
        const visit = (node) => {
            const line = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).line + 1;
            const column = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).character;
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration:
                    const classDecl = node;
                    if (classDecl.name) {
                        result.classes.push({
                            name: classDecl.name.text,
                            node: classDecl,
                            line,
                            column,
                        });
                    }
                    break;
                case ts.SyntaxKind.InterfaceDeclaration:
                    const interfaceDecl = node;
                    if (interfaceDecl.name) {
                        result.interfaces.push({
                            name: interfaceDecl.name.text,
                            node: interfaceDecl,
                            line,
                            column,
                        });
                    }
                    break;
                case ts.SyntaxKind.FunctionDeclaration:
                    const funcDecl = node;
                    if (funcDecl.name) {
                        result.functions.push({
                            name: funcDecl.name.text,
                            node: funcDecl,
                            line,
                            column,
                        });
                    }
                    break;
                case ts.SyntaxKind.VariableStatement:
                    const varDecl = node;
                    result.variables.push({
                        name: this.getVariableStatementName(varDecl),
                        node: varDecl,
                        line,
                        column,
                    });
                    break;
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        return result;
    }
    /**
     * Extract import declarations from a SourceFile
     *
     * @param sourceFile - Parsed AST
     * @returns Array of import information
     */
    static getImports(sourceFile) {
        const imports = [];
        const visit = (node) => {
            const line = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).line + 1;
            const column = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).character;
            switch (node.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    const importDecl = node;
                    const identifiers = this.extractImportIdentifiers(importDecl);
                    const moduleSpecifier = importDecl.moduleSpecifier
                        ? importDecl.moduleSpecifier.text
                        : '';
                    imports.push({
                        kind: 'import',
                        identifiers,
                        moduleSpecifier,
                        node: importDecl,
                        line,
                        column,
                    });
                    break;
                case ts.SyntaxKind.VariableStatement:
                    const varDecl = node;
                    if (this.isRequireStatement(varDecl)) {
                        const identifiers = this.extractRequireIdentifiers(varDecl);
                        const moduleSpecifier = this.extractRequireModuleSpecifier(varDecl);
                        imports.push({
                            kind: 'require',
                            identifiers,
                            moduleSpecifier,
                            node: varDecl,
                            line,
                            column,
                        });
                    }
                    break;
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        return imports;
    }
    /**
     * Get all used identifiers in the source file
     *
     * @param sourceFile - Parsed AST
     * @returns Set of used identifier names
     */
    static getUsedIdentifiers(sourceFile) {
        const usedIdentifiers = new Set();
        const visit = (node) => {
            switch (node.kind) {
                case ts.SyntaxKind.Identifier:
                    const identifier = node;
                    // Skip if this is a declaration name
                    if (!this.isDeclarationName(node)) {
                        usedIdentifiers.add(identifier.text);
                    }
                    break;
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        return usedIdentifiers;
    }
    /**
     * Get all defined identifiers in the source file
     *
     * @param sourceFile - Parsed AST
     * @returns Set of defined identifier names
     */
    static getDefinedIdentifiers(sourceFile) {
        const definedIdentifiers = new Set();
        const visit = (node) => {
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.VariableDeclaration:
                case ts.SyntaxKind.Parameter:
                case ts.SyntaxKind.PropertyDeclaration:
                case ts.SyntaxKind.MethodDeclaration:
                    if (node.kind === ts.SyntaxKind.VariableDeclaration) {
                        const varDecl = node;
                        if (varDecl.name && ts.isIdentifier(varDecl.name)) {
                            definedIdentifiers.add(varDecl.name.text);
                        }
                    }
                    else if ('name' in node && node.name && ts.isIdentifier(node.name)) {
                        definedIdentifiers.add(node.name.text);
                    }
                    break;
                case ts.SyntaxKind.BindingElement:
                    const bindingElement = node;
                    if (bindingElement.name && ts.isIdentifier(bindingElement.name)) {
                        definedIdentifiers.add(bindingElement.name.text);
                    }
                    break;
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
        return definedIdentifiers;
    }
    /**
     * Find duplicate declarations in the source file
     *
     * @param sourceFile - Parsed AST
     * @returns Object containing duplicate information
     */
    static findDuplicateDeclarations(sourceFile) {
        const result = {
            duplicateClasses: [],
            duplicateInterfaces: [],
            duplicateFunctions: [],
            duplicateMethods: [],
            duplicateVariables: [],
        };
        // Track declarations by name
        const classMap = new Map();
        const interfaceMap = new Map();
        const functionMap = new Map();
        const methodMap = new Map();
        const variableMap = new Map();
        const visit = (node, currentClass) => {
            const line = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).line + 1;
            const column = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart()).character;
            switch (node.kind) {
                case ts.SyntaxKind.ClassDeclaration:
                    const classDecl = node;
                    if (classDecl.name) {
                        const name = classDecl.name.text;
                        if (!classMap.has(name)) {
                            classMap.set(name, []);
                        }
                        classMap.get(name).push({ line, column });
                        // Visit class members
                        ts.forEachChild(node, (child) => visit(child, name));
                    }
                    break;
                case ts.SyntaxKind.InterfaceDeclaration:
                    const interfaceDecl = node;
                    if (interfaceDecl.name) {
                        const name = interfaceDecl.name.text;
                        if (!interfaceMap.has(name)) {
                            interfaceMap.set(name, []);
                        }
                        interfaceMap.get(name).push({ line, column });
                    }
                    break;
                case ts.SyntaxKind.FunctionDeclaration:
                    const funcDecl = node;
                    if (funcDecl.name) {
                        const name = funcDecl.name.text;
                        if (!functionMap.has(name)) {
                            functionMap.set(name, []);
                        }
                        functionMap.get(name).push({ line, column });
                    }
                    break;
                case ts.SyntaxKind.MethodDeclaration:
                    const methodDecl = node;
                    if (methodDecl.name && ts.isIdentifier(methodDecl.name)) {
                        const name = methodDecl.name.text;
                        const key = currentClass ? `${currentClass}.${name}` : name;
                        if (!methodMap.has(key)) {
                            methodMap.set(key, []);
                        }
                        methodMap.get(key).push({ line, column, classLine: currentClass ? line : undefined });
                    }
                    break;
                case ts.SyntaxKind.VariableStatement:
                    const varDecl = node;
                    const name = this.getVariableStatementName(varDecl);
                    if (name) {
                        if (!variableMap.has(name)) {
                            variableMap.set(name, []);
                        }
                        variableMap.get(name).push({ line, column });
                    }
                    break;
            }
            if (node.kind !== ts.SyntaxKind.ClassDeclaration) {
                ts.forEachChild(node, (child) => visit(child, currentClass));
            }
        };
        visit(sourceFile);
        // Convert maps to results
        for (const [name, locations] of classMap) {
            if (locations.length > 1) {
                result.duplicateClasses.push({ name, locations });
            }
        }
        for (const [name, locations] of interfaceMap) {
            if (locations.length > 1) {
                result.duplicateInterfaces.push({ name, locations });
            }
        }
        for (const [name, locations] of functionMap) {
            if (locations.length > 1) {
                result.duplicateFunctions.push({ name, locations });
            }
        }
        for (const [key, locations] of methodMap) {
            if (locations.length > 1) {
                const [className, methodName] = key.includes('.') ? key.split('.') : ['', key];
                result.duplicateMethods.push({
                    name: methodName,
                    className: className || undefined,
                    locations
                });
            }
        }
        for (const [name, locations] of variableMap) {
            if (locations.length > 1) {
                result.duplicateVariables.push({ name, locations });
            }
        }
        return result;
    }
    /**
     * Check if an identifier is a declaration name
     */
    static isDeclarationName(node) {
        const parent = node.parent;
        if (!parent)
            return false;
        switch (parent.kind) {
            case ts.SyntaxKind.ClassDeclaration:
            case ts.SyntaxKind.InterfaceDeclaration:
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.VariableDeclaration:
            case ts.SyntaxKind.Parameter:
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
                return parent.name === node;
            case ts.SyntaxKind.BindingElement:
                return parent.name === node;
            case ts.SyntaxKind.ImportSpecifier:
                return parent.name === node;
            default:
                return false;
        }
    }
    /**
     * Extract identifiers from import declaration
     */
    static extractImportIdentifiers(importDecl) {
        const identifiers = [];
        if (importDecl.importClause) {
            if (importDecl.importClause.namedBindings && importDecl.importClause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
                const namedImports = importDecl.importClause.namedBindings;
                for (const specifier of namedImports.elements) {
                    identifiers.push(specifier.name.text);
                }
            }
            else if (importDecl.importClause.name) {
                identifiers.push(importDecl.importClause.name.text);
            }
            if (importDecl.importClause.namedBindings && importDecl.importClause.namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
                const namespaceImport = importDecl.importClause.namedBindings;
                identifiers.push(namespaceImport.name.text);
            }
        }
        return identifiers;
    }
    /**
     * Check if variable statement is a require statement
     */
    static isRequireStatement(varDecl) {
        if (varDecl.declarationList.declarations.length !== 1)
            return false;
        const declaration = varDecl.declarationList.declarations[0];
        if (!declaration.initializer)
            return false;
        const initializer = declaration.initializer;
        return ts.isCallExpression(initializer) &&
            ts.isIdentifier(initializer.expression) &&
            initializer.expression.text === 'require';
    }
    /**
     * Extract identifiers from require statement
     */
    static extractRequireIdentifiers(varDecl) {
        const identifiers = [];
        if (varDecl.declarationList.declarations.length === 1) {
            const declaration = varDecl.declarationList.declarations[0];
            if (declaration.name && ts.isIdentifier(declaration.name)) {
                identifiers.push(declaration.name.text);
            }
        }
        return identifiers;
    }
    /**
     * Extract module specifier from require statement
     */
    static extractRequireModuleSpecifier(varDecl) {
        if (varDecl.declarationList.declarations.length === 1) {
            const declaration = varDecl.declarationList.declarations[0];
            if (declaration.initializer && ts.isCallExpression(declaration.initializer)) {
                const callExpr = declaration.initializer;
                if (callExpr.arguments.length > 0 && ts.isStringLiteral(callExpr.arguments[0])) {
                    return callExpr.arguments[0].text;
                }
            }
        }
        return '';
    }
    /**
     * Get name from variable statement
     */
    static getVariableStatementName(varDecl) {
        if (varDecl.declarationList.declarations.length === 1) {
            const declaration = varDecl.declarationList.declarations[0];
            if (declaration.name && ts.isIdentifier(declaration.name)) {
                return declaration.name.text;
            }
            else if (declaration.name && ts.isArrayBindingPattern(declaration.name)) {
                // For destructuring, use a placeholder
                return 'destructured';
            }
        }
        return '';
    }
}
//# sourceMappingURL=ast-utils.js.map