import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";

import api from "./api";

import GeneralContext from "./GeneralContext";

import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid, mode = "BUY" }) => {
  const generalContext = useContext(GeneralContext);
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(0.0);

  const handleSubmitClick = () => {
    api.post("/newOrder", {
      name: uid,
      qty: stockQuantity,
      price: stockPrice,
      mode,
    });

    generalContext.closeBuyWindow();
  };

  const handleCancelClick = () => {
    generalContext.closeBuyWindow();
  };

  return (
    <div
      className={`container${mode === "SELL" ? " sell-mode" : ""}`}
      id="buy-window"
      draggable="true"
    >
      <div className="order-header">
        <p className="order-uid">{uid}</p>
        <span className={`order-type ${mode === "SELL" ? "sell" : "buy"}`}>
          {mode}
        </span>
      </div>
      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="qty"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
            />
          </fieldset>
        </div>
      </div>

      <div className="buttons">
        <span>Margin required ₹140.65</span>
        <div>
          <Link
            className={`btn ${mode === "SELL" ? "btn-red" : "btn-blue"}`}
            onClick={handleSubmitClick}
          >
            {mode === "SELL" ? "Sell" : "Buy"}
          </Link>
          <Link to="" className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;