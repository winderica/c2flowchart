// const fs = require('fs');
class BlockStatement {
    constructor(statements) {
        this.statements = statements;
        this.type = 'block';
    }
}
class ForStatement extends BlockStatement {
    constructor(statements, expression) {
        super(statements);
        this.type = 'for';
        this.expression = expression;
    }
}
class WhileStatement extends BlockStatement {
    constructor(statements, expression) {
        super(statements);
        this.type = 'while';
        this.expression = expression;
    }
}
class DoWhileStatement extends BlockStatement {
    constructor(statements, expression) {
        super(statements);
        this.type = 'doWhile';
        this.expression = expression;
    }
}
class IfStatement extends BlockStatement {
    constructor(statements, expression, elseStatements) {
        super(statements);
        this.type = 'if';
        this.expression = expression;
        this.elseStatements = elseStatements;
    }
}
class SwitchStatement extends BlockStatement {
    constructor(expression, cases, defaultStatements) {
        super();
        this.type = 'switch';
        this.expression = expression;
        this.cases = cases;
        this.defaultStatements = defaultStatements;
    }
}
const parser = (str, start) => {
    const removeSpaces = (str) => {
        return str.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
    };
    const finder = (str) => {
        const findNext = (query, index) => {
            while (true) {
                if (str[index] === "'") {
                    index++;
                    while (str[index] && str[index] !== "'") {
                        index++;
                    }
                    index++;
                }
                else if (str[index] === '"') {
                    index++;
                    while (str[index] && str[index] !== '"') {
                        index++;
                    }
                    index++;
                }
                else if (str.slice(index, index + 2) === '//') {
                    while (str[index] && str[index] !== '\n') {
                        index++;
                    }
                }
                else if (str.slice(index, index + 2) === '/*') {
                    while (str[index] && str.slice(index, index + 2) !== '*/') {
                        index++;
                    }
                    index += 2;
                }
                else if (str[index] === '{') {
                    index = findNext('}', index + 1) + 1;
                }
                else if (str[index] === '(') {
                    index = findNext(')', index + 1) + 1;
                }
                else if (str[index] === '[') {
                    index = findNext(']', index + 1) + 1;
                }
                else if (!str[index]) {
                    return index;
                }
                else if (str.slice(index, index + query.length) === query) {
                    return index;
                }
                else {
                    index++;
                }
            }
        };
        return findNext;
    };
    const lexer = (str, start) => {
        const statements = [];
        let prev = start;
        const findNext = finder(str);
        for (let i = start; i < str.length; i++) {
            if (str[i] === "'") {
                i++;
                while (str[i] && str[i] !== "'") {
                    i++;
                }
                i++;
            }
            if (str[i] === '"') {
                i++;
                while (str[i] && str[i] !== '"') {
                    i++;
                }
                i++;
            }
            if (str.slice(i, i + 2) === '//') {
                while (str[i] && str[i] !== '\n') {
                    i++;
                }
                prev = i;
            }
            if (str.slice(i, i + 2) === '/*') {
                while (str[i] && str.slice(i, i + 2) !== '*/') {
                    i++;
                }
                i += 2;
                prev = i;
            }
            if (str[i] === '{') {
                const end = findNext('}', i + 1);
                statements.push(new BlockStatement(parser(str.slice(i + 1, end), 0)));
                i = end + 1;
                prev = i;
            }
            if (str.slice(i, i + 3) === "for") {
                const forResult = /^for\s*/.exec(str.slice(i));
                if (forResult && !/\w/.exec(str[i - 1] || "")) {
                    const initializationStart = i + forResult[0].length + 1;
                    const initializationEnd = findNext(';', initializationStart);
                    const initialization = removeSpaces(str.slice(initializationStart, initializationEnd));
                    const conditionStart = initializationEnd + 1;
                    const conditionEnd = findNext(';', conditionStart);
                    const condition = removeSpaces(str.slice(conditionStart, conditionEnd));
                    const incrementStart = conditionEnd + 1;
                    const incrementEnd = findNext(')', incrementStart);
                    const increment = removeSpaces(str.slice(incrementStart, incrementEnd));
                    const block = /^\s*{/.exec(str.slice(incrementEnd + 1));
                    const statementsStart = incrementEnd + 1 + (block ? block[0].length : 0);
                    const statementsEnd = block ? findNext('}', statementsStart) + 1 : findNext(';', statementsStart) + 1;
                    statements.push(new ForStatement(parser(str.slice(statementsStart, statementsEnd), 0), {
                        initialization,
                        condition,
                        increment
                    }));
                    i = statementsEnd;
                    prev = i;
                }
            }
            if (str.slice(i, i + 2) === "if") {
                const ifResult = /^if\s*/.exec(str.slice(i));
                if (ifResult && !/\w/.exec(str[i - 1] || "")) {
                    const expressionStart = i + ifResult[0].length + 1;
                    const expressionEnd = findNext(')', expressionStart);
                    const expression = removeSpaces(str.slice(expressionStart, expressionEnd));
                    const block = /^\s*{/.exec(str.slice(expressionEnd + 1));
                    const statementsStart = expressionEnd + 1 + (block ? block[0].length : 0);
                    const statementsEnd = block ? findNext('}', statementsStart) + 1 : findNext(';', statementsStart) + 1;
                    const elseResult = /^[\s;{}]*else\s/.exec(str.slice(statementsEnd));
                    if (elseResult) {
                        const elseHead = statementsEnd + elseResult[0].length;
                        const elseBlock = /^\s*{/.exec(str.slice(elseHead));
                        const elseStart = elseBlock ? 1 + elseHead : elseHead;
                        const elseEnd = elseBlock ? findNext('}', elseStart) + 1 : findNext(';', elseStart) + 1;
                        const elseStatement = parser(str.slice(elseStart, elseEnd), 0);
                        statements.push(new IfStatement(parser(str.slice(statementsStart, statementsEnd), 0), expression, elseStatement));
                        i = elseEnd;
                    }
                    else {
                        statements.push(new IfStatement(parser(str.slice(statementsStart, statementsEnd), 0), expression));
                        i = statementsEnd;
                    }
                    prev = i;
                }
            }
            if (str.slice(i, i + 5) === "while") {
                const whileResult = /^while\s*/.exec(str.slice(i));
                if (whileResult && !/\w/.exec(str[i - 1] || "")) {
                    const expressionStart = i + whileResult[0].length + 1;
                    const expressionEnd = findNext(')', expressionStart);
                    const expression = removeSpaces(str.slice(expressionStart, expressionEnd));
                    const block = /^\s*{/.exec(str.slice(expressionEnd + 1));
                    const statementsStart = expressionEnd + 1 + (block ? block[0].length : 0);
                    const statementsEnd = block ? findNext('}', statementsStart) + 1 : findNext(';', statementsStart) + 1;
                    statements.push(new WhileStatement(parser(str.slice(statementsStart, statementsEnd), 0), expression));
                    i = statementsEnd;
                    prev = i;
                }
            }
            if (str[i] === ';') {
                statements.push(removeSpaces(str.slice(prev, i)));
                prev = i + 1;
            }
        }
        return statements;
    };
    return lexer(str, start);
};
const generateCode = (statements) => {
    const indexGenerator = (function* () {
        let i = 0;
        while (true) {
            yield i;
            i++;
        }
    })();
    const nodes = [`start=>start: 开始`, `end=>end: 结束`];
    const allSteps = [];
    const flow = (statements, start, end) => {
        const steps = [start];
        const queue = [];
        statements.map(i => {
            if (i instanceof BlockStatement) {
                if (i instanceof IfStatement) {
                    const name = `node_${indexGenerator.next().value}`;
                    nodes.push(`${name}=>condition: ${i.expression}?`);
                    queue.push(() => {
                        flow(i.statements, `${name}(yes)`, steps[steps.indexOf(name) + 1]);
                    });
                    if (i.elseStatements) {
                        queue.push(() => {
                            flow(i.elseStatements, `${name}(no)`, steps[steps.indexOf(name) + 1]);
                        });
                    }
                    else {
                        queue.push(() => {
                            flow([], `${name}(no)`, steps[steps.indexOf(name) + 1]);
                        });
                    }
                    steps.push(name);
                }
                if (i instanceof WhileStatement) {
                    const name = `node_${indexGenerator.next().value}`;
                    nodes.push(`${name}=>condition: ${i.expression}?`);
                    queue.push(() => {
                        flow(i.statements, `${name}(yes)`, name);
                        flow([], `${name}(no)`, steps[steps.indexOf(name) + 1]);
                    });
                    steps.push(name);
                }
                if (i instanceof ForStatement) {
                    const nodeName = `node_${indexGenerator.next().value}`;
                    const initialName = `node_${indexGenerator.next().value}`;
                    nodes.push(`${initialName}=>operation: ${i.expression.initialization}`);
                    steps.push(`${initialName}`);
                    nodes.push(`${nodeName}=>condition: ${i.expression.condition}?`);
                    i.statements.push(i.expression.increment);
                    queue.push(() => {
                        flow(i.statements, `${nodeName}(yes)`, nodeName);
                        flow([], `${nodeName}(no)`, steps[steps.indexOf(nodeName) + 1]);
                    });
                    steps.push(nodeName);
                }
            }
            else {
                const name = `node_${indexGenerator.next().value}`;
                nodes.push(`${name}=>operation: ${i}`);
                steps.push(name);
            }
        });
        steps.push(end);
        queue.map(i => i());
        allSteps.unshift(steps);
    };
    flow(statements, `start`, `end`);
    return `${nodes.join('\n')}\n${allSteps.map(i => i.join('->')).join('\n')}`;
};
// const statements = parser(fs.readFileSync('test/test.c').toString(), 0);
// fs.writeFileSync('test/output.json', JSON.stringify(statements));
// const code = generateCode(statements);
// fs.writeFileSync('test/output2.txt', code);
const cCodeArea = document.querySelector('#c-code');
const flowchartCodeArea = document.querySelector('#flowchart-code');
cCodeArea.addEventListener('input', () => {
    const cCode = cCodeArea.value;
    const statements = parser(cCode, 0);
    flowchartCodeArea.value = generateCode(statements);
});