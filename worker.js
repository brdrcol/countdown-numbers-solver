'use strict'
importScripts('solver.js')
const solver = new Solver()
let target, numbers, ready

onmessage = function(e) {
	const msg = e.data
	if (!msg) {
		console.error('Worker received an empty message')
	} else if(ready && msg === 'start1') {
		solver.solve(target, numbers, postMessage)
		postMessage('done')
	} else if (ready && msg === 'start2') {
		postMessage(solver.solve(target, numbers))
		postMessage('done')
	} else if (msg.target && msg.numbers) {
		target = e.data['target']
		numbers = e.data['numbers']
		ready = true
	} else if (msg === 'reset') {
		solver.abort()
		target = null
		numbers = null
		ready = false
	} else {
		console.error('Worker received rubbish', e)
	}
}
