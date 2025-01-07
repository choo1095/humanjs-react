const IdleState = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "rgba(256, 256, 256, 0.8)",
        display: "grid",
        placeItems: "center",
        position: "absolute",
        top: "0",
        left: "0",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          fontFamily: "monospace",
          background: "#b0bcd1",
          padding: "24px",
          boxShadow: "4px 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        Idle State
      </div>
    </div>
  );
};

export default IdleState;
