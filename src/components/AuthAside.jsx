import Brand from './Brand.jsx';
import { IconCheck } from './Icons.jsx';

export default function AuthAside({ claim, lead, points = [] }) {
  return (
    <aside className="auth-aside">
      <Brand light size={36} />

      <div>
        <h1 className="auth-claim">
          {claim.map((line, index) => (
            <span key={index}>{line}</span>
          ))}
        </h1>

        <p className="auth-lead">{lead}</p>

        <ul className="auth-points">
          {points.map((point) => (
            <li key={point}>
              <span className="auth-check">
                <IconCheck />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <p className="auth-foot">CS2032 Cloud Computing — UTEC · Sistema de Administracion de Condominios</p>
    </aside>
  );
}
