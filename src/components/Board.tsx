const Board = () => {};
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
//               color={checker.color}
//               onMove={handleCheckerMove}
//             />
//           ))}
//         </Triangle>
//       ))}
//     </div>
//   );
// };

// export default Board;
