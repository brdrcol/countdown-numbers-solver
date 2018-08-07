'use strict'

try {
	if (typeof module !== 'undefined') module.exports = Solver // CommonJS require()
		else window.Solver = Solver // <script src="">
} catch (ex) {
	console.log('Web worker') // Web Workers importScripts()
}

function Solver() {
	
	const ops = [addition, subtraction, multiplication, division]
	let aborted = false
	let solutionArray
		
	function Node(numbers, value, parents, op) {
		this.numbers = numbers
		this.value = value
		this.parents = parents
		this.op = op
		return this
	}
	
	function solve(goal, numbers, onSolve, stopAt) {
		if (!onSolve) {
			solutionArray = []
			onSolve = function(n) {
				solutionArray.push(n)
			}
		}
		aborted = false
		let nodes
		if (typeof numbers[0] === 'number') {
			// Generate inital nodes from plain numbers
			nodes = [new Node(numbers.map(e => new Node(null, e)))]
		} else {
			nodes = numbers // Adopt provided nodes
		}
		while (!aborted && nodes.length > 0) {
			let newNodes = process(nodes.pop(), goal, onSolve)
			nodes.push.apply(nodes, newNodes)
			if (stopAt && nodes.length > stopAt) {
				// Expand the node list without solving to completion
				return nodes
			}
		}
		return solutionArray
	}
	
	function abort() {
		aborted = true
	}
	
	function addition(a, b) {
		const result = a + b
		if (result != 0) return result
		return null
	}
		
	function subtraction (a, b) {
		const result = a - b
		if (result > 0) return result
		return null
	}
		
	function multiplication (a, b) {
		if (a == 1 || b == 1) return null
		return a * b
	}
		
	function division(a, b) {
		if (a <= 1 || b <= 1) return null
		const result = a / b
		if (Math.floor(result) === result) return result
		return null
	}
		
	addition.symbol = '+'
	subtraction.symbol = '-'
	multiplication.symbol = '*'
	division.symbol = '/'
	
	// For each pair of numbers, do each operation and contruct the next generation of nodes
	function process(node, goal, onSolve) {
		const children = []
		for (let i = 0; i < node.numbers.length; i++) {
			for (let j = 0; j < node.numbers.length; j++) {
				if (i == j) continue // Don't use the same number twice
				let a = node.numbers[i], b = node.numbers[j]
				let numbers = node.numbers.filter((e, idx) => (idx !== i && idx !== j))
				const parents = [a, b]
				ops.forEach(op => {
					const result = op(a.value, b.value)
					if (!result) return // null means invalid, 0 would be a useless value
					const child = new Node(null, result, parents, op.symbol)
					if (result === goal) {
						onSolve(child)
					} else if (numbers.length) {
						child.numbers = numbers.concat(child)
						children.push(child)
					} // else, dead end
				})
			}
		}
		return children		
	}
	
	this.solve = solve
	this.abort = abort
	return this
}


