import { useDispatch, useSelector } from "react-redux";
import { increment, decrement } from "../store/actions";

const Counter = () => {
  const dispatch = useDispatch();
  const count = useSelector((state: any) => state.count);

  return (
    <div>
      <h2>Counter.tsx</h2>

      <table>
        <tbody>
          <tr>
            <td>Count</td>
            <td>:</td>
            <td>{count}</td>
          </tr>
        </tbody>
      </table>

      <button onClick={() => dispatch(increment())}>Increment</button>
      <br />
      <button onClick={() => dispatch(decrement())}>Decrement</button>
    </div>
  );
};

export default Counter;
