export interface CheckerProps {
  color: string;
  onMove: () => void;
}

const Checker = ({ color, onMove }: CheckerProps) => {
  return <div className={`checker ${color}`} onClick={() => onMove()}></div>;
};

export default Checker;
