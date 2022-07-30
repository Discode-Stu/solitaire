import "./index.scss"
import React from "react"
import { createStore, combineReducers } from "redux"
// const { createStore, combineReducers } = Redux;
import { connect } from "react-redux"
// const { connect, Provider } = ReactRedux;
/*********
 * Constatants
 **********/
const consts = {
  FOUNDATION: "FOUNDATION",
  TABLEAU: "TABLEAU",

  HEART: "HEART",
  CLOVER: "CLOVER",
  TILE: "TILE",
  PIKE: "PIKE",
}

/*********
 * REACT
 **********/
export const Game = (() => {
  const UnconnectedGame = ({ congratulation }) => (
    <div id="container">
      <div className="header">
        <Stock />
        <Foundation />
      </div>
      <Tableau />
      <div
        className="congratulation"
        style={{ visibility: congratulation ? "visible" : "hidden" }}
      >
        <h1>Congratulation, you did it!</h1>
      </div>
    </div>
  )
  const mapStateToProps = (state, ownProps) => {
    return {
      congratulation:
        state.foundation[0].cards.length === 13 &&
        state.foundation[1].cards.length === 13 &&
        state.foundation[2].cards.length === 13 &&
        state.foundation[3].cards.length === 13,
    }
  }

  return connect(mapStateToProps)(UnconnectedGame)
})()

const Stock = (() => {
  const UnconnectedStock = ({ rest, flopped }) => (
    <div className="stock">
      <div className="rest">
        {rest.map((card) => (
          <div
            className="cardContainer"
            key={JSON.stringify({ suit: card.suit, number: card.number })}
          >
            <Card
              key={JSON.stringify({ suit: card.suit, number: card.number })}
              suit={card.suit}
              number={card.number}
              stack={true}
              turned={card.turned}
              locked={card.locked}
              last={false}
            />
          </div>
        ))}
      </div>
      <div className="flop">
        {flopped.map((card) => (
          <div
            className="cardContainer"
            key={JSON.stringify({ suit: card.suit, number: card.number })}
          >
            <Card
              key={JSON.stringify({ suit: card.suit, number: card.number })}
              suit={card.suit}
              number={card.number}
              stack={true}
              turned={card.turned}
              locked={card.locked}
              last={card.last}
            />
          </div>
        ))}
      </div>
    </div>
  )

  const mapStateToProps = (state, ownProps) => {
    return {
      rest: state.stock.rest,
      flopped: state.stock.flopped,
    }
  }

  return connect(mapStateToProps)(UnconnectedStock)
})()

const Foundation = (() => {
  const UnconnectedFoundation = ({ piles }) => (
    <div className="foundation">
      {piles.map((pile, pileIndex) => (
        <div className="pile" key={pileIndex}>
          {pile.cards.map((card) => (
            <div
              className="cardContainer"
              key={JSON.stringify({ suit: card.suit, number: card.number })}
            >
              <Card
                key={JSON.stringify({ suit: card.suit, number: card.number })}
                suit={card.suit}
                number={card.number}
                turned={card.turned}
                locked={card.locked}
                last={card.last}
              />
            </div>
          ))}
          <DropSite
            key={JSON.stringify({ type: consts.FOUNDATION, index: pileIndex })}
            pileType={consts.FOUNDATION}
            pileIndex={pileIndex}
            visible={pile.drop}
          />
        </div>
      ))}
    </div>
  )

  const mapStateToProps = (state, ownProps) => {
    return {
      piles: state.foundation,
    }
  }

  return connect(mapStateToProps)(UnconnectedFoundation)
})()

const Tableau = (() => {
  const UnconnectedTableau = ({ piles }) => (
    <div className="tableau">
      {piles.map((pile, pileIndex) => (
        <div className="pile" key={pileIndex}>
          {pile.cards.map((card, index) => (
            <div
              className="cardContainer"
              key={JSON.stringify({ suit: card.suit, number: card.number })}
            >
              <Card
                key={JSON.stringify({ suit: card.suit, number: card.number })}
                suit={card.suit}
                number={card.number}
                stack={false}
                turned={card.turned}
                locked={card.locked}
                last={card.last}
              />
            </div>
          ))}
          <DropSite
            key={JSON.stringify({ type: consts.TABLEAU, index: pileIndex })}
            pileType={consts.TABLEAU}
            pileIndex={pileIndex}
            visible={pile.drop}
          />
        </div>
      ))}
    </div>
  )

  const mapStateToProps = (state, ownProps) => {
    return {
      piles: state.tableau,
    }
  }

  return connect(mapStateToProps)(UnconnectedTableau)
})()

/*********
 * React: Card
 *********/
const Card = (() => {
  class UnconnectedCard extends React.Component {
    constructor({ suit, number, stack, turned, locked, last }) {
      super({ suit, number, stack, turned, locked, last })

      this.state = {
        rotation: turned ? 0 : -180,
      }

      this.turn = this.turn.bind(this)
      this.dragStart = this.dragStart.bind(this)
      this.dragEnd = this.dragEnd.bind(this)
    }

    turn() {
      if (this.props.stack === true) {
        this.props.flop()
      } else {
        if (this.props.turned === true || this.props.locked) {
          return
        }

        let lastTime = null

        const slideBackAnimation = ((time) => {
          let rotation = null
          if (lastTime !== null) {
            const delta = (time - lastTime) * 0.4
            rotation = Math.min(0, this.state.rotation + delta)
            this.setState({ rotation })
          }
          lastTime = time
          if (rotation !== 0) requestAnimationFrame(slideBackAnimation)
        }).bind(this)

        requestAnimationFrame(slideBackAnimation)
      }
    }

    dragStart(ev) {
      ev.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          suit: this.props.suit,
          number: this.props.number,
        })
      )
      this.props.dragStart()
    }

    dragEnd(ev) {
      this.props.dragEnd()
    }

    render() {
      let suit
      switch (this.props.suit) {
        case consts.HEART:
          suit = <Heart />
          break
        case consts.TILE:
          suit = <Tile />
          break
        case consts.CLOVER:
          suit = <Clover />
          break
        case consts.PIKE:
          suit = <Pike />
          break
        default:
          suit = <Heart />
          break
      }
      return (
        <div className="card">
          <div
            className="cardFace frontFace"
            style={{ transform: `rotateY(${this.state.rotation}deg)` }}
            draggable={this.props.locked === false}
            onDragStart={this.dragStart}
            onDragEnd={this.dragEnd}
          >
            <div>
              <h1 className={this.props.suit}>{this.props.number}</h1>
              {suit}
            </div>
          </div>
          <div
            className={
              "cardFace backFace" +
              (this.props.locked === false ? " pointer" : "")
            }
            style={{ transform: `rotateY(${this.state.rotation + 180}deg)` }}
            onClick={this.turn}
          />
        </div>
      )
    }
  }

  const mapDispatchToProps = (dispatch, ownProps) => {
    return {
      dragStart: () => {
        dispatch({
          type: "DRAG_START",
          suit: ownProps.suit,
          number: ownProps.number,
          last: ownProps.last,
        })
      },
      dragEnd: () => {
        dispatch({ type: "DRAG_END" })
      },
      flop: () => {
        dispatch({ type: "FLOP" })
      },
    }
  }
  return connect(null, mapDispatchToProps)(UnconnectedCard)
})()

const Heart = ({ zoom = false }) => (
  <svg
    className="suitIcon"
    width={zoom === true ? 40 : 20}
    height={zoom === true ? 40 : 20}
    viewBox="0 0 20 20"
  >
    <path
      className="heart"
      d="
         M 0 6 
         A 2.5 2.5 0 0 1 10 6 
         A 2.5 2.5 0 0 1 20 6
         Q 16 14 10 19
         Q 4 14 0 6"
    />
  </svg>
)

const Tile = ({ zoom = false }) => (
  <svg
    className="suitIcon"
    width={zoom === true ? 40 : 20}
    height={zoom === true ? 40 : 20}
    viewBox="0 0 20 20"
  >
    <path
      className="tile"
      d="
         M 10 0 
         Q 13 5 17 10 
         Q 13 15 10 20
         Q 7 15 3 10
         Q 7 5 10 0"
    />
  </svg>
)

const Clover = ({ zoom = false }) => (
  <svg
    className="suitIcon"
    width={zoom === true ? 40 : 20}
    height={zoom === true ? 40 : 20}
    viewBox="0 0 20 20"
  >
    <circle className="clover" cx="10" cy="5" r="4.5" />
    <circle className="clover" cx="5" cy="11" r="4.5" />
    <circle className="clover" cx="15" cy="11" r="4.5" />
    <polygon className="clover" points="10 10, 13 20, 7 20" />
  </svg>
)

const Pike = ({ zoom = false }) => (
  <svg
    className="suitIcon"
    width={zoom === true ? 40 : 20}
    height={zoom === true ? 40 : 20}
    viewBox="0 0 20 20"
  >
    <path
      className="pike"
      d="
         M 0 12 
         A 2.5 2.5 0 0 0 10 12 
         A 2.5 2.5 0 0 0 20 12
         Q 16 4 10 0
         Q 4 4 0 12"
    />
    <polygon className="pike" points="10 10, 13 20, 7 20" />
  </svg>
)

/*********
 * React: Drop Site
 *********/
const DropSite = (() => {
  class UnconnectedDropSite extends React.Component {
    constructor({ pileType, pileIndex, visible, drop }) {
      super({ pileType, pileIndex, visible, drop })

      this.allowDrop = this.allowDrop.bind(this)
      this.drop = this.drop.bind(this)
    }

    allowDrop(ev) {
      ev.preventDefault()
    }

    drop(ev) {
      ev.preventDefault()
      let data = JSON.parse(ev.dataTransfer.getData("text"))
      this.props.drop(data.suit, data.number)
    }

    render() {
      return (
        <div
          className="dropTarget"
          style={{ visibility: this.props.visible ? "visible" : "hidden" }}
          onDrop={this.drop}
          onDragOver={this.allowDrop}
        >
          <h1>+</h1>
        </div>
      )
    }
  }

  const mapDispatchToProps = (dispatch, ownProps) => {
    return {
      drop: (suit, number) => {
        dispatch({
          type: "DRAG_END",
        })
        dispatch({
          type: "DROP",
          targetPileType: ownProps.pileType,
          targetPileIndex: ownProps.pileIndex,
          suit,
          number,
        })
      },
    }
  }
  return connect(null, mapDispatchToProps)(UnconnectedDropSite)
})()

/*********
 * React DOM
 *********/
// ReactDOM.render(
//   <Provider store={store}>
//     <Game />
//   </Provider>,
//   document.getElementById("app")
// )
// const root = createRoot(document.getElementById("root"))
// root.render(<Game />)
