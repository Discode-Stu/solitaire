import { createStore, combineReducers } from "redux"

const consts = {
  FOUNDATION: "FOUNDATION",
  TABLEAU: "TABLEAU",

  HEART: "HEART",
  CLOVER: "CLOVER",
  TILE: "TILE",
  PIKE: "PIKE",
}
/*********
 * REDUX: Store
 **********/
export const store = (() => {
  let cards = (() => {
    function deck() {
      let cards = []
      for (let i = 2; i <= 14; i++) {
        let number = i
        if (i === 11) number = "J"
        if (i === 12) number = "Q"
        if (i === 13) number = "K"
        if (i === 14) number = "A"
        cards.push({ suit: consts.HEART, number })
        cards.push({ suit: consts.TILE, number })
        cards.push({ suit: consts.CLOVER, number })
        cards.push({ suit: consts.PIKE, number })
      }
      return cards
    }

    function shuffle(a) {
      for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i)
        ;[a[i - 1], a[j]] = [a[j], a[i - 1]]
      }
    }

    let cards = deck()
    shuffle(cards)
    return cards
  })()

  function pop(cards, turned = false) {
    if (turned) {
      return { ...cards.shift(), turned: true, locked: false, last: true }
    } else {
      return { ...cards.shift(), turned: false, locked: true, last: false }
    }
  }

  const initialState = {
    tableau: [
      { drop: false, cards: [pop(cards, true)] },
      { drop: false, cards: [pop(cards), pop(cards, true)] },
      { drop: false, cards: [pop(cards), pop(cards), pop(cards, true)] },
      {
        drop: false,
        cards: [pop(cards), pop(cards), pop(cards), pop(cards, true)],
      },
      {
        drop: false,
        cards: [
          pop(cards),
          pop(cards),
          pop(cards),
          pop(cards),
          pop(cards, true),
        ],
      },
      {
        drop: false,
        cards: [
          pop(cards),
          pop(cards),
          pop(cards),
          pop(cards),
          pop(cards),
          pop(cards, true),
        ],
      },
      {
        drop: false,
        cards: [
          pop(cards),
          pop(cards),
          pop(cards),
          pop(cards),
          pop(cards),
          pop(cards),
          pop(cards, true),
        ],
      },
    ],
    stock: {
      rest: [
        ...cards.map((card) => ({
          suit: card.suit,
          number: card.number,
          turned: false,
          locked: false,
          last: false,
        })),
      ],
      flopped: [],
    },
    foundation: [
      { drop: false, cards: [] },
      { drop: false, cards: [] },
      { drop: false, cards: [] },
      { drop: false, cards: [] },
    ],
  }

  const stockReducer = (state = initialState.stock, action) => {
    switch (action.type) {
      case "FLOP": {
        const rest = [
          ...state.flopped.map((card) => ({
            suit: card.suit,
            number: card.number,
            turned: false,
            locked: false,
          })),
          ...state.rest,
        ]

        let flopped = []
        const first = rest.pop()
        const second = rest.pop()
        const third = rest.pop()
        if (third !== undefined) {
          flopped.push(
            Object.assign({}, third, {
              turned: true,
              locked: true,
              last: false,
            })
          )
        }
        if (second !== undefined) {
          flopped.push(
            Object.assign({}, second, {
              turned: true,
              locked: true,
              last: false,
            })
          )
        }
        if (first !== undefined) {
          flopped.push(
            Object.assign({}, first, {
              turned: true,
              locked: false,
              last: true,
            })
          )
        }

        return {
          rest,
          flopped,
        }
      }
      case "DROP": {
        const topFlop = state.flopped[state.flopped.length - 1]
        if (
          topFlop !== undefined &&
          topFlop.suit === action.suit &&
          topFlop.number === action.number
        ) {
          // The top of the flopped cards has been moved
          let flopped = []
          if (state.flopped.length > 2) {
            flopped = flopped.concat(state.flopped.slice(0, -2))
          }
          if (state.flopped.length > 1) {
            flopped.push(
              Object.assign({}, state.flopped[state.flopped.length - 2], {
                locked: false,
                last: true,
              })
            )
          }
          return {
            rest: state.rest,
            flopped,
          }
        }
        return state
      }
      default: {
        return state
      }
    }
  }

  const foundationReducer = (state = initialState.foundation, action) => {
    switch (action.type) {
      case "DRAG_START": {
        if (action.last !== true) {
          return state
        }
        function match(targetCard, draggedCard) {
          if (targetCard === undefined && draggedCard.number === "A") {
            return true
          }
          if (targetCard === undefined) {
            return false
          }
          return (
            targetCard.suit === draggedCard.suit &&
            ((targetCard.number === "A" && draggedCard.number === 2) ||
              (targetCard.number === 10 && draggedCard.number === "J") ||
              (targetCard.number === "J" && draggedCard.number === "Q") ||
              (targetCard.number === "Q" && draggedCard.number === "K") ||
              targetCard.number + 1 === draggedCard.number)
          )
        }

        let draggedCard = { suit: action.suit, number: action.number }
        return state.map((pile) => ({
          drop: match(pile.cards[pile.cards.length - 1], draggedCard),
          cards: [...pile.cards],
        }))
      }
      case "DRAG_END": {
        return state.map((pile) => ({
          drop: false,
          cards: [...pile.cards],
        }))
      }
      case "DROP": {
        function match(card, suit, number) {
          return (
            card !== undefined && card.suit === suit && card.number === number
          )
        }

        // Check if the moved card belonged to the foundation piles
        const sourcePileIndex = state.findIndex((pile) =>
          match(pile.cards[pile.cards.length - 1], action.suit, action.number)
        )

        return state.map((pile, pileIndex) => {
          // Add the card to the corresponding pile if the target is a foundation pile
          if (
            action.targetPileType === consts.FOUNDATION &&
            action.targetPileIndex === pileIndex
          ) {
            return {
              drop: false,
              cards: [
                ...pile.cards.map((card) => ({
                  suit: card.suit,
                  number: card.number,
                  turned: true,
                  locked: true,
                  last: false,
                })),
                {
                  suit: action.suit,
                  number: action.number,
                  turned: true,
                  locked: false,
                  last: true,
                },
              ],
            }
          }
          // Remove the card from if it has been part of a foundation pile
          if (sourcePileIndex !== undefined && sourcePileIndex === pileIndex) {
            let cards = []
            if (pile.cards.length > 2) {
              cards = cards.concat(pile.cards.slice(0, -2))
            }
            if (pile.cards.length > 1) {
              cards.push(
                Object.assign({}, pile.cards[pile.cards.length - 2], {
                  locked: false,
                  last: true,
                })
              )
            }
            return {
              drop: false,
              cards,
            }
          }
          // Return the pile unchanged if it has not been affected by the drop
          return pile
        })
      }
      default: {
        return state
      }
    }
  }

  const tableauReducer = (state = initialState.tableau, action) => {
    switch (action.type) {
      case "DRAG_START": {
        function match(targetCard, draggedCard) {
          if (targetCard === undefined && draggedCard.number === "K") {
            return true
          }
          if (targetCard === undefined) {
            return false
          }
          return (
            ((targetCard.number === "K" && draggedCard.number === "Q") ||
              (targetCard.number === "Q" && draggedCard.number === "J") ||
              (targetCard.number === "J" && draggedCard.number === 10) ||
              targetCard.number === draggedCard.number + 1) &&
            (((targetCard.suit === consts.HEART ||
              targetCard.suit === consts.TILE) &&
              (draggedCard.suit === consts.CLOVER ||
                draggedCard.suit === consts.PIKE)) ||
              ((targetCard.suit === consts.CLOVER ||
                targetCard.suit === consts.PIKE) &&
                (draggedCard.suit === consts.HEART ||
                  draggedCard.suit === consts.TILE)))
          )
        }

        let draggedCard = { suit: action.suit, number: action.number }
        return state.map((pile) => ({
          drop: match(pile.cards[pile.cards.length - 1], draggedCard),
          cards: [...pile.cards],
        }))
      }
      case "DRAG_END": {
        return state.map((pile) => ({
          drop: false,
          cards: [...pile.cards],
        }))
      }
      case "DROP": {
        function match(card, suit, number) {
          return (
            card !== undefined && card.suit === suit && card.number === number
          )
        }

        const [tableauWithoutMovingCards, movingCards] = state.reduce(
          (accumulated, currentPile) => {
            const index = currentPile.cards.findIndex((card) =>
              match(card, action.suit, action.number)
            )
            if (index !== -1) {
              let cards = []
              if (index > 1) {
                cards = cards.concat(
                  currentPile.cards.slice(0, index - 1).map((card) => ({
                    suit: card.suit,
                    number: card.number,
                    turned: card.turned,
                    locked: card.locked,
                    last: false,
                  }))
                )
              }
              if (index > 0) {
                cards.push(
                  Object.assign({}, currentPile.cards[index - 1], {
                    locked: false,
                    last: true,
                  })
                )
              }
              accumulated[0].push({
                drop: false,
                cards,
              })
              accumulated[1] = currentPile.cards.slice(index).map((card) => ({
                suit: card.suit,
                number: card.number,
                turned: true,
                locked: false,
                last: card.last,
              }))
            } else {
              accumulated[0].push(currentPile)
            }
            return accumulated
          },
          [
            [
              // Tableau without moving cards
            ],
            [
              // Moving cards default (overwritten if source found in a tableau pile)
              {
                suit: action.suit,
                number: action.number,
                turned: true,
                locked: false,
                last: true,
              },
            ],
          ]
        )
        if (action.targetPileType === consts.TABLEAU) {
          tableauWithoutMovingCards[action.targetPileIndex] = {
            drop: false,
            cards: tableauWithoutMovingCards[action.targetPileIndex].cards
              .map((card) => ({
                suit: card.suit,
                number: card.number,
                turned: card.turned,
                locked: card.locked,
                last: false,
              }))
              .concat(movingCards),
          }
          return tableauWithoutMovingCards
        }
        return tableauWithoutMovingCards
      }
      default: {
        return state
      }
    }
  }

  const mainReducer = combineReducers({
    stock: stockReducer,
    foundation: foundationReducer,
    tableau: tableauReducer,
  })

  return createStore(mainReducer)
})()
