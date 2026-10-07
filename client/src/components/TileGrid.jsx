import { Link } from "react-router-dom";
import Tilt from "./Tilt";

const COLORS = ["blue", "purple", "teal", "orange", "green", "pink", "slate", "red"];

const TileGrid = ({ tiles }) => (
  <div className="row g-3 g-md-4">
    {tiles.map((t, i) => (
      <div className="col-6 col-md-4 col-xl-3" key={t.to}>
        <Tilt>
          <Link to={t.to} className={`tile tile--${t.color || COLORS[i % COLORS.length]}`}>
            <span className="tile__icon">{t.icon}</span>
            <h6 className="tile__title">{t.title}</h6>
            <p className="tile__text">{t.text}</p>
          </Link>
        </Tilt>
      </div>
    ))}
  </div>
);

export default TileGrid;