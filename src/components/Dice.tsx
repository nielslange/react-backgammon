import { useDispatch, useSelector } from "react-redux";
import { rollDice, swapDice, shiftDice } from "../store/actions";

const Dice = () => {
  const dispatch = useDispatch();
  const dice = useSelector((state: any) => state.dice);
  const diceOne = useSelector((state: any) => state.dice[0]);
  const diceTwo = useSelector((state: any) => state.dice[1]);
  const bonusOne = useSelector((state: any) => state.dice[2]);
  const bonusTwo = useSelector((state: any) => state.dice[3]);

  return (
    <div>
      <h2>Dice.tsx</h2>

      <table>
        <tbody>
          <tr>
            <td>Dice</td>
            <td>:</td>
            <td>{dice}</td>
          </tr>
          <tr>
            <td>Dice one</td>
            <td>:</td>
            <td>{diceOne}</td>
          </tr>
          <tr>
            <td>Dice two</td>
            <td>:</td>
            <td>{diceTwo}</td>
          </tr>
          <tr>
            <td>Bonus one</td>
            <td>:</td>
            <td>{bonusOne}</td>
          </tr>
          <tr>
            <td>Bonus two</td>
            <td>:</td>
            <td>{bonusTwo}</td>
          </tr>
        </tbody>
      </table>

      <button onClick={() => dispatch(rollDice())}>Roll dice</button>
      <br />
      <button onClick={() => dispatch(swapDice())}>Swap dice</button>
      <br />
      <button onClick={() => dispatch(shiftDice())}>Shift dice</button>
    </div>
  );
};

export default Dice;
