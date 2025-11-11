"use client"

import React, { createContext, useContext, useReducer, useEffect, useState } from "react"

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalPrice: number
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        }
      } else {
        const newItem = { ...action.payload, quantity: 1 }
        const updatedItems = [...state.items, newItem]
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        }
      }
    }
    
    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter(item => item.id !== action.payload)
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      }
    }
    
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, { type: "REMOVE_ITEM", payload: action.payload.id })
      }
      
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      )
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      }
    }
    
    case "CLEAR_CART":
      return initialState
    
    case "LOAD_CART": {
      return {
        items: action.payload,
        totalItems: action.payload.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: action.payload.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      }
    }
    
    default:
      return state
  }
}

interface CartContextType {
  state: CartState
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    console.log("Loading cart from localStorage:", savedCart)
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart)
        console.log("Parsed cart items:", cartItems)
        if (Array.isArray(cartItems) && cartItems.length > 0) {
          dispatch({ type: "LOAD_CART", payload: cartItems })
        }
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log("Saving cart to localStorage:", state.items)
    if (state.items.length > 0) {
      localStorage.setItem("cart", JSON.stringify(state.items))
    }
  }, [state.items])

  // Also check localStorage on every render to ensure cart persistence
  useEffect(() => {
    const checkCart = () => {
      const savedCart = localStorage.getItem("cart")
      console.log("Checking cart - savedCart:", savedCart, "state.items.length:", state.items.length)
      if (savedCart && state.items.length === 0) {
        try {
          const cartItems = JSON.parse(savedCart)
          if (Array.isArray(cartItems) && cartItems.length > 0) {
            console.log("Found cart items in localStorage, loading them:", cartItems)
            dispatch({ type: "LOAD_CART", payload: cartItems })
          }
        } catch (error) {
          console.error("Error loading cart from localStorage:", error)
        }
      } else if (!savedCart && state.items.length === 0) {
        console.log("No cart in localStorage and state is empty - cart was likely cleared")
      } else if (savedCart && state.items.length > 0) {
        console.log("Cart state and localStorage are in sync")
      }
    }
    
    // Check cart after a short delay to ensure localStorage is available
    const timer = setTimeout(checkCart, 50)
    return () => clearTimeout(timer)
  }, [state.items.length])

  // Additional check on window focus to ensure cart persistence
  useEffect(() => {
    const handleFocus = () => {
      const savedCart = localStorage.getItem("cart")
      if (savedCart && state.items.length === 0) {
        try {
          const cartItems = JSON.parse(savedCart)
          if (Array.isArray(cartItems) && cartItems.length > 0) {
            console.log("Window focus - Found cart items in localStorage, loading them:", cartItems)
            dispatch({ type: "LOAD_CART", payload: cartItems })
          }
        } catch (error) {
          console.error("Error loading cart from localStorage on focus:", error)
        }
      } else if (!savedCart && state.items.length === 0) {
        console.log("Window focus - No cart in localStorage, cart was likely cleared")
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [state.items.length])

  const addItem = (item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD_ITEM", payload: item })
  }

  const removeItem = (id: string) => {
    console.log("Removing item with id:", id)
    dispatch({ type: "REMOVE_ITEM", payload: id })
    // Also update localStorage immediately
    const updatedItems = state.items.filter(item => item.id !== id)
    localStorage.setItem("cart", JSON.stringify(updatedItems))
    console.log("Updated localStorage after removal:", updatedItems)
  }

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } })
  }

  const clearCart = () => {
    console.log("Clearing cart...")
    dispatch({ type: "CLEAR_CART" })
    // Also clear from localStorage
    localStorage.removeItem("cart")
    console.log("Cart cleared from localStorage")
  }

  return (
    <CartContext.Provider value={{ state, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
