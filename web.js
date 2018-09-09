const ui = {
	nums: [
		document.getElementById('num1'),
		document.getElementById('num2'),
		document.getElementById('num3'),
		document.getElementById('num4'),
		document.getElementById('num5'),
		document.getElementById('num6')
	],
	solutions: document.getElementById('solution-list'),
	target: document.getElementById('target'),
	start: document.getElementById('start'),
	addBig: document.getElementById('add-big'),
	addSmall: document.getElementById('add-small'),
	clear: document.getElementById('clear'),
	showSolutions: document.getElementById('show-solutions')
}

ui.clear.addEventListener('click', clearUi)
ui.addBig.addEventListener('click', addBig)
ui.addSmall.addEventListener('click', addSmall)
ui.start.addEventListener('click', start)
ui.showSolutions.addEventListener('click', showSolutions)

const workers = []
const numWorkers = 4
const solutionMode = 'start2'
const error = console.error
let bigs, smalls, target, solver
let numbers = [], solutions = {}, lastTarget = null, lastNumbers = ''

let busyWorkers, startTime, endTime

window.addEventListener('load', function() {
	/* Spin up web workers */
	for (let i = 0; i < numWorkers; i++) {
		let worker = new Worker('worker.js')
		worker.onmessage = handleWorkerMsg
		workers.push(worker)
	}
	// This solver is used to generate enough nodes to feed the workers
	solver = new Solver()
}, true)

clearUi()

function clearUi() {
	/* Reset the UI and reshuffle the number pools */
	bigs = shuffle([25, 50, 75, 100])
	smalls = shuffle([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9])
	target = null
	lastTarget = null
	ui.target.value = '???'
	numbers = []
	ui.nums.forEach(el => el.value = '?')
	clearSolutions()
}

function clearSolutions() {
	solutions = {}
	ui.showSolutions.textContent = '...'
	ui.solutions.className = 'hidden'
	while (ui.solutions.firstChild) {
		ui.solutions.removeChild(ui.solutions.firstChild)
	}
}

function handleWorkerMsg(msg) {
	/* Worker message routing */
	if (msg.data === 'done') {
		handleDone()
	} else if (Array.isArray(msg.data)) { 
		msg.data.forEach(handleSolution)
	} else if (msg.data && msg.data.value === target) {
		handleSolution(msg.data)
	} else {
		console.error('Unknown message from worker', msg.data)
	}
}

function handleDone() {
	/* Collect done messages from all workers */
	if (busyWorkers <= 0) return
	if (--busyWorkers === 0) {
		// All complete, print timing information, reset workers show all the solutions
		endTime = Date.now()
		console.log(`Solving took ${endTime - startTime}ms`)
		workers.forEach(w => w.postMessage('reset'))
		ui.showSolutions.textContent = `Show ${Object.keys(solutions).length} solutions`
	}
}

function shuffle(arr) {
	/* Standard array shuffle */
	let j, t
	for (let i = arr.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1))
		t = arr[j]
		arr[j] = arr[i]
		arr[i] = t
	}
	return arr
}

function start() {
	/* Choose target number, generate solutions*/
	numbers = ui.nums.map(e => parseInt(e.value))
	if (numbers.length < 6) {
		return error(`Choose six numbers before starting the round`)
	}
	if (!solver) {
		return error(`Solving script hasn't loaded`)
	}
	clearSolutions()
	const newNumbers = numbers.join(',')
	if (!lastTarget || newNumbers === lastNumbers) {
		setTarget()
	}
	lastNumbers = newNumbers
	if (!target) {
		return
	}
	startTime = Date.now()
	/* Generate initial nodes */
	let nodes = solver.solve(target, numbers, handleSolution, numWorkers)
	let nodesPerWorker = Math.ceil(nodes.length / numWorkers)
	busyWorkers = numWorkers
	for (let i = 0; i < numWorkers; i++) {
		// Feed each worker a different slice of the seed nodes
		let a = i*nodesPerWorker
		let b = Math.min(a+nodesPerWorker, nodes.length)
		let nodeSlice = nodes.slice(a, b)
		workers[i].postMessage({target, numbers: nodeSlice})
		workers[i].postMessage(solutionMode)
	}
}

function showSolutions() {
	/* Unhide the answers */
	ui.solutions.className = ''
}

function addBig() {
	/* Add a random big number (from the top) to the display and number array */
	if (bigs.length == 0) {
		return error(`Only 4 large numbers may be chosen`)
	}
	if (numbers.length >= 6) {
		return error(`Only 6 numbers may be selected. Start the round.`)
	}
	let big = bigs.shift()
	ui.nums[numbers.length].value = big
	numbers.push(big)
}

function addSmall() {
	/* Add a random small number (from the bottom) to the display and number array */
	if (numbers.length >= 6) {
		return error(`Only 6 numbers may be selected. Start the round.`)
	}
	let small = smalls.shift()
	ui.nums[numbers.length].value = small
	numbers.push(small)
}

function setTarget() {
	/* Either choose a target or use the altered target */
	let current = parseInt(ui.target.value) || null
	
	if (!current || current === lastTarget) {
		// Generate a new target
		target = Math.floor(Math.random()*900)+100
		ui.target.value = target
	} else {
		// Solve the user's game
		target = current
		ui.target.value = target
	}
	lastTarget = target
}

function handleSolution(node) {
	/* Append solution to the UI list */
	let sol = expressionSolution(node)
	// sol = `${sol} = ${eval(sol)}`
	// Only show solutions with  a unique final step
	const key = [node.parents[0].value, node.parents[1].value].sort().join(node.op)
	if (!solutions[key]){
		solutions[key] = sol
		const newSol = document.createElement('li')
		newSol.textContent = sol
		ui.solutions.appendChild(newSol)
	}
}

function expressionSolution(solution) {
	/* Turn a tree into an overly-parenthesised expression */
	const recurse = function(node) {
		if (!node.parents) {
			return `${node.value}`
		} else if (node.op == '+' || node.op == '-') {
			return `(${recurse(node.parents[0])}${node.op}${recurse(node.parents[1])})`
		} else {
			return `${recurse(node.parents[0])}${node.op}${recurse(node.parents[1])}`
		}
	}
	return recurse(solution)
}

