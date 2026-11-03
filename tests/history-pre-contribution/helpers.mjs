export function setTaskSize(task, size = 'S') {
  task.size = size;
  return task;
}

export function setAllTaskSizes(game, size = 'S') {
  for (const task of game.slots.filter(Boolean)) setTaskSize(task, size);
  return game;
}

// Isolated physics/scoring fixtures. Full game lifecycle and staffing are tested
// separately with start()/transfer(); these helpers intentionally set crew size.
export function staff(game, id) {
  const slot = game.slots.findIndex((task) => task?.id === id && task.state === 'task');
  if (game.status === 'over' || slot < 0) return false;
  game.status = 'running';
  game.minions = [{ slot, position: 0 }];
  return true;
}
export function unstaff(game) { game.minions = []; }
