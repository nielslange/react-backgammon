import { useDispatch, useSelector } from "react-redux";
import { moveChecker } from "../store/actions";

interface CheckerProps {
  className: string;
  id: number;
  player: string;
  currentPlayer: string;
}

const Checker = (props: CheckerProps) => {
  const dispatch = useDispatch();
  const currentPlayer = useSelector((state: any) => state.currentPlayer);
  const { className, id, player } = props;
  const handleClick = (event: any) => {
    console.log(currentPlayer);
    console.log(event.target);
    dispatch(moveChecker(props));
  };

  return (
    <div
      className={className}
      key={id}
      data-checker={id}
      data-player={player}
      onClick={handleClick}
    >
      {id}
    </div>
  );
};

export default Checker;
