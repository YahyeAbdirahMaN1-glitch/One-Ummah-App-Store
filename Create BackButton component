import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "10px 15px",
        border: "none",
        background: "none",
        fontSize: "17px",
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      <ArrowLeft size={20} />
      Back
    </button>
  );
}
