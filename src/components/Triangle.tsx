import Checker from "./Checker";
import { CheckerProps } from "./Checker";

interface TriangleProps {
  checkers: CheckerProps[];
}

const Triangle = ({ checkers }: TriangleProps) => {
  return (
    <div className="triangle">
      {checkers.map((checker, index) => (
        <Checker key={index} color={checker.color} onMove={checker.onMove} />
      ))}
    </div>
  );
};

export default Triangle;
