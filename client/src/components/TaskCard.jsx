import { useNavigate } from "react-router-dom";

export function TaskCard({ task }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-card p-3 hover:bg-muted hover:cursor-pointer rounded-lg shadow-md"
      onClick={() => {
        navigate(`/tasks/${task.id}`);
      }}
    >
      <h1 className="text-card-foreground font-bold uppercase">
        {task.title}
      </h1>
      <p className="text-muted-foreground">{task.description}</p>
    </div>
  );
}
