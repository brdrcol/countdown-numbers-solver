const Solver = require('./solver')

function handleSolution(node) {
	let sol = expressionSolution(node)
	let res = eval(sol)
	console.log(`${sol} = ${res}`)
}

function expressionSolution(solution) {
	const recurse = function(node) {
		if (!node.parents) {
			return `${node.value}`
		} else {
			return `(${recurse(node.parents[0])}${node.op}${recurse(node.parents[1])})`
		}
	}
	let text = recurse(solution)
	return text
}

const numbers = [1, 5, 7, 9, 9, 100]
const goal = 332
const solver = new Solver()
solver.solve(goal, numbers, handleSolution)
