import { useDispatch, useSelector } from "react-redux";
import { rollDice } from "../store/actions";

const Dice = () => {
  const dispatch = useDispatch();
  const diceOne = useSelector((state: any) => state.dice.one);
  const diceTwo = useSelector((state: any) => state.dice.two);
  const bonusOne = useSelector((state: any) => state.bonus.one);
  const bonusTwo = useSelector((state: any) => state.bonus.two);

  return (
    <div>
      <h2>Dice.tsx</h2>

      <table>
        <tbody>
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

      <button onClick={() => dispatch(rollDice())}>Roll Dice</button>
    </div>
  );
};

export default Dice;
