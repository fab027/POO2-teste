import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const RegisterPage = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<"analista" | "apostador" | "admin">("analista");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !senha) {
      setError("Preencha todos os campos.");
      return;
    }
    const success = register(nome, email, senha, perfil);
    if (success) navigate("/");
    else setError("Erro ao cadastrar.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display font-bold text-xl">
            S
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Criar Conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre-se para acessar o Sportando</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-sport focus:outline-none focus:ring-1 focus:ring-sport"
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-sport focus:outline-none focus:ring-1 focus:ring-sport"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-sport focus:outline-none focus:ring-1 focus:ring-sport"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Perfil de Acesso</label>
            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value as any)}
              className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm text-foreground focus:border-sport focus:outline-none focus:ring-1 focus:ring-sport"
            >
              <option value="analista">Analista</option>
              <option value="apostador">Apostador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Cadastrar
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-sport hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
