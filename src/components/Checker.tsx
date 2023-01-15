import { useSelector } from "react-redux";

const Checker = () => {
  const checkers = useSelector((state: any) => state.checkers);

  return (
    <div>
      <h2>Checker.tsx</h2>

      <table>
        <tbody>
          <tr>
            <td></td>
            <td>Player one</td>
            <td>Player two</td>
          </tr>
          <tr>
            <td>Checker one</td>
            <th>{checkers.one.row}</th>
            <th>{checkers.one.player}</th>
            <th>{checkers.one.state}</th>
          </tr>
          <tr>
            <td>Checker two</td>
            <th>{checkers.two.row}</th>
            <th>{checkers.two.player}</th>
            <th>{checkers.two.state}</th>
          </tr>
          <tr>
            <td>Checker three</td>
            <th>{checkers.three.row}</th>
            <th>{checkers.three.player}</th>
            <th>{checkers.three.state}</th>
          </tr>
          {/* <tr>
            <td>Checker two</td>
            <th>{checkers.playerOne.two.row}</th>
            <th>{checkers.playerTwo.two.row}</th>
          </tr>
          <tr>
            <td>Checker three</td>
            <th>{checkers.playerOne.three.row}</th>
            <th>{checkers.playerTwo.three.row}</th>
          </tr>
          <tr>
            <td>Checker four</td>
            <th>{checkers.playerOne.four.row}</th>
            <th>{checkers.playerTwo.four.row}</th>
          </tr>
          <tr>
            <td>Checker five</td>
            <th>{checkers.playerOne.five.row}</th>
            <th>{checkers.playerTwo.five.row}</th>
          </tr>
          <tr>
            <td>Checker six</td>
            <th>{checkers.playerOne.six.row}</th>
            <th>{checkers.playerTwo.six.row}</th>
          </tr>
          <tr>
            <td>Checker seven</td>
            <th>{checkers.playerOne.seven.row}</th>
            <th>{checkers.playerTwo.seven.row}</th>
          </tr>
          <tr>
            <td>Checker eight</td>
            <th>{checkers.playerOne.eight.row}</th>
            <th>{checkers.playerTwo.eight.row}</th>
          </tr>
          <tr>
            <td>Checker nine</td>
            <th>{checkers.playerOne.nine.row}</th>
            <th>{checkers.playerTwo.nine.row}</th>
          </tr>
          <tr>
            <td>Checker ten</td>
            <th>{checkers.playerOne.ten.row}</th>
            <th>{checkers.playerTwo.ten.row}</th>
          </tr>
          <tr>
            <td>Checker eleven</td>
            <th>{checkers.playerOne.eleven.row}</th>
            <th>{checkers.playerTwo.eleven.row}</th>
          </tr>
          <tr>
            <td>Checker twelve</td>
            <th>{checkers.playerOne.twelve.row}</th>
            <th>{checkers.playerTwo.twelve.row}</th>
          </tr>
          <tr>
            <td>Checker thirteen</td>
            <th>{checkers.playerOne.thirteen.row}</th>
            <th>{checkers.playerTwo.thirteen.row}</th>
          </tr>
          <tr>
            <td>Checker fourteen</td>
            <th>{checkers.playerOne.fourteen.row}</th>
            <th>{checkers.playerTwo.fourteen.row}</th>
          </tr>
          <tr>
            <td>Checker fifteen</td>
            <th>{checkers.playerOne.fifteen.row}</th>
            <th>{checkers.playerTwo.fifteen.row}</th>
          </tr> */}
        </tbody>
      </table>
    </div>
  );
};

export default Checker;
