import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "./api";

function formatTimestamp(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Orders = () => {
  // null = still loading, [] = loaded but empty
  const [allOrders, setAllOrders] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/allOrders")
      .then((res) => setAllOrders(res.data))
      .catch(() =>
        setError("Couldn't load your orders. Please refresh and try again.")
      );
  }, []);

  if (error) {
    return (
      <div className="orders">
        <div className="no-orders">
          <p>{error}</p>
          <Link to="/" className="btn btn-blue">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (allOrders === null) {
    return (
      <div className="orders">
        <div className="no-orders">
          <p>
            Loading your orders
            <span className="dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div className="orders">
        <div className="no-orders">
          <p>You haven't placed any orders today</p>

          <Link to="/" className="btn btn-blue">
            Get started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h3 className="title">Orders ({allOrders.length})</h3>

      <div className="order-table">
        <table>
          <tr>
            <th>Instrument</th>
            <th>Qty.</th>
            <th>Price</th>
            <th>Type</th>
            <th>Placed at</th>
          </tr>

          {allOrders.map((order, index) => (
            <tr key={index}>
              <td>{order.name}</td>
              <td>{order.qty}</td>
              <td>{Number(order.price).toFixed(2)}</td>
              <td>
                <span
                  className={`mode-chip ${order.mode === "SELL" ? "sell" : "buy"}`}
                >
                  {order.mode}
                </span>
              </td>
              <td>{formatTimestamp(order.createdAt)}</td>
            </tr>
          ))}
        </table>
      </div>
    </>
  );
};

export default Orders;