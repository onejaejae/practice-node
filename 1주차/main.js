const express = require("express");

const app = express();

app.use(express.json());

let todos = [];
let todoId = 1;

// 모든 할 일 목록 조회
app.get("/todos", (_req, res) => {
  return res.status(200).json(todos);
});

// 완료된 할 일만 조회 (추가 도전 과제)
app.get("/todos/completed", (_req, res) => {
  const completedTodos = todos.filter((todo) => todo.completed);
  return res.status(200).json(completedTodos);
});

// 특정 할 일 조회
app.get("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  const todo = todos.find((todo) => todo.id === id);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  return res.status(200).json(todo);
});

// 할 일 추가
app.post("/todos", (req, res) => {
  const { task } = req.body;

  if (!task || typeof task !== "string" || task.trim() === "") {
    return res
      .status(400)
      .json({ message: "Task is required and must be a non-empty string" });
  }

  const newTodo = {
    id: todoId++,
    task,
    completed: false,
  };

  todos.push(newTodo);
  return res.status(201).json(newTodo);
});

// 할 일 수정
app.put("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { task, completed } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  const todoIndex = todos.findIndex((todo) => todo.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ message: "Todo not found" });
  }

  // 수정할 내용 확인
  if (task !== undefined && (typeof task !== "string" || task.trim() === "")) {
    return res.status(400).json({ message: "Task must be a non-empty string" });
  }

  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).json({ message: "Completed must be a boolean" });
  }

  // 기존 값 유지 또는 새 값 사용
  todos[todoIndex] = {
    ...todos[todoIndex],
    task: task !== undefined ? task : todos[todoIndex].task,
    completed: completed !== undefined ? completed : todos[todoIndex].completed,
  };

  return res.status(200).json(todos[todoIndex]);
});

// 할 일 삭제
app.delete("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  const todoIndex = todos.findIndex((todo) => todo.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ message: "Todo not found" });
  }

  todos.splice(todoIndex, 1);
  return res.status(200).json({ message: "Deleted successfully" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
