import { useSelector } from "react-redux";
import Checker from "./Checker";
interface LanesProps {
  from: number;
  to: number;
}

const Lane = ({ from, to }: LanesProps): JSX.Element => {
  const checkers = useSelector((state: any) => state.checkers);
  const currentPlayer = useSelector((state: any) => state.currentPlayer);
  const lanes = [];
  if (from < to) {
    for (let i = from; i <= to; i++) {
      const checker: any = [];
      for (let j = 0; j < checkers.length; j++) {
        if (checkers[j].row === i) {
          const props = {
            className: "checker",
            id: checkers[j].id,
            player: checkers[j].player,
            currentPlayer: currentPlayer,
          };
          checker.push(<Checker {...props} />);
        }
      }
      lanes.push(
        <div className="lane" data-lane={i} key={i}>
          {checker}
        </div>
      );
    }
  } else {
    for (let i = from; i >= to; i--) {
      const checker: any = [];
      for (let j = 0; j < checkers.length; j++) {
        if (checkers[j].row === i) {
          const props = {
            className: "checker",
            id: checkers[j].id,
            player: checkers[j].player,
            currentPlayer: currentPlayer,
          };
          checker.push(<Checker {...props} />);
        }
      }
      lanes.push(
        <div className="lane" data-lane={i} key={i}>
          {checker}
        </div>
      );
    }
  }
  return <>{lanes}</>;
};
export default Lane;
