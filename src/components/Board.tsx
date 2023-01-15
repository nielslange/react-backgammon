import { useSelector } from "react-redux";

const Board = () => {
  const data = useSelector((state: any) => state.checkers);
  const checkers = Object.entries(data).map(([checker, obj]) => {
    const checkerData = obj as {
      id: number;
      player: string;
      row: number;
      state: string;
    };
    return {
      checker,
      id: checkerData.id,
      player: checkerData.player,
      row: checkerData.row,
      state: checkerData.state,
    };
  });

  const handleClick = (event: any) => {
    console.log(event.target.dataset.checker);
  };

  return (
    <div>
      <h2>Board.tsx</h2>

      <div className="board">
        <div className="board-top">
          <div className="lane" data-lane="13">
            <div
              onClick={handleClick}
              className="checker"
              data-player="2"
              data-checker="24"
            ></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="14">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="15">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="16">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="17">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="18">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="19">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="20">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="21">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="22">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="23">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
          <div className="lane" data-lane="24">
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="2" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
            <div className="checker" data-player="1" data-checker="24"></div>
          </div>
        </div>
        <div className="board-bottom">
          <div className="lane" data-lane="12"></div>
          <div className="lane" data-lane="11"></div>
          <div className="lane" data-lane="10"></div>
          <div className="lane" data-lane="9"></div>
          <div className="lane" data-lane="8"></div>
          <div className="lane" data-lane="7"></div>
          <div className="lane" data-lane="6"></div>
          <div className="lane" data-lane="5"></div>
          <div className="lane" data-lane="4"></div>
          <div className="lane" data-lane="3"></div>
          <div className="lane" data-lane="2"></div>
          <div className="lane" data-lane="1"></div>
        </div>
      </div>

      <table>
        <tbody>
          <tr>
            <td>ID</td>
            <td>ROW</td>
            <td>PLAYER</td>
            <td>STATE</td>
          </tr>
          {checkers.map((checker) => {
            return (
              <tr key={checker.id}>
                <td>{checker.id}</td>
                <td>{checker.row}</td>
                <td>{checker.player}</td>
                <td>{checker.state}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
export default Board;

// import { useSelector, useDispatch } from "react-redux";
// import { moveChecker } from "./actions";
// import Triangle from "./Triangle";
// import Checker from "./Checker";

// const Board = () => {
//   const triangles = useSelector((state) => state.triangles);
//   const dispatch = useDispatch();

//   const handleCheckerMove = (start, end) => {
//     dispatch(moveChecker(start, end));
//   };

//   return (
//     <div className="game-board">
//       {triangles.map((triangle, index) => (
//         <Triangle key={index}>
//           {triangle.checkers.map((checker, index) => (
//             <Checker
//               key={index}
//               color={checkers.color}
//               onMove={handleCheckerMove}
//             />
//           ))}
//         </Triangle>
//       ))}
//     </div>
//   );
// };

// export default Board;
