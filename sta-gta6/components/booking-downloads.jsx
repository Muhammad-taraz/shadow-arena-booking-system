"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { range } from "../lib/booking.js";

const STATUS = {
  pending: { label: "UNDER REVIEW", color: "#5c4a24" },
  approved: { label: "CONFIRMED", color: "#15543f" },
  rejected: { label: "NOT VERIFIED", color: "#672c36" },
};

function statusUrl(ref) {
  const url = new URL("/track", window.location.origin);
  url.searchParams.set("ref", ref);
  return url.toString();
}

export default function BookingDownloads({ booking }) {
  const [qrSrc, setQrSrc] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(statusUrl(booking.ref), {
      width: 320,
      margin: 2,
      color: { dark: "#0b1020", light: "#ffffff" },
    })
      .then((src) => {
        if (active) {
          setQrSrc(src);
          setError("");
        }
      })
      .catch(() => {
        if (active) setError("Could not create the booking QR code.");
      });

    return () => {
      active = false;
    };
  }, [booking.ref]);

  function downloadQrPng() {
    if (!qrSrc) return;
    const link = document.createElement("a");
    link.href = qrSrc;
    link.download = `shadow-arena-${booking.ref}-qr.png`;
    link.click();
  }

  async function downloadTicketPng() {
    if (!qrSrc) return;
    setError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1120;
      canvas.height = 860;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable");
      ctx.scale(2, 2);

      const background = ctx.createLinearGradient(0, 0, 560, 430);
      background.addColorStop(0, "#111a32");
      background.addColorStop(1, "#20203b");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 560, 430);
      ctx.fillStyle = "#e4343f";
      ctx.fillRect(0, 0, 560, 8);

      ctx.fillStyle = "#f1f4fb";
      ctx.font = "700 14px Arial, sans-serif";
      ctx.fillText("SHADOW TOURNAMENT ARENA", 36, 44);
      ctx.fillStyle = "#8e9ab8";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText("BOOKING PASS", 36, 66);

      const badge = STATUS[booking.status] || STATUS.pending;
      ctx.fillStyle = badge.color;
      ctx.fillRect(400, 30, 124, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 11px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(badge.label, 462, 49);
      ctx.textAlign = "left";

      ctx.fillStyle = "#f1f4fb";
      ctx.font = "700 32px Arial, sans-serif";
      ctx.fillText(booking.ref, 36, 124);
      ctx.fillStyle = "#c9d3ea";
      ctx.font = "14px Arial, sans-serif";
      ctx.fillText("Keep this reference for your arena visit.", 36, 151);

      const consoleName =
        booking.consoles.length === 2
          ? "Both PS5s"
          : `PS5 ${booking.consoles[0] === 1 ? "One" : "Two"}`;
      const dateLabel = new Date(
        `${booking.date}T00:00:00Z`,
      ).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
      const rows = [
        ...(booking.name ? [["PLAYER", booking.name]] : []),
        ["DATE", dateLabel],
        ["SESSION", range(booking.startHour, booking.duration)],
        ["CONSOLE", consoleName],
      ];
      rows.forEach(([label, value], index) => {
        const y = 205 + index * 52;
        ctx.fillStyle = "#8e9ab8";
        ctx.font = "700 10px Arial, sans-serif";
        ctx.fillText(label, 36, y);
        ctx.fillStyle = "#f1f4fb";
        ctx.font = "16px Arial, sans-serif";
        const maxWidth = 274;
        let displayValue = value;
        while (
          ctx.measureText(`${displayValue}...`).width > maxWidth &&
          displayValue.length > 1
        ) {
          displayValue = displayValue.slice(0, -1);
        }
        if (displayValue !== value) displayValue += "...";
        ctx.fillText(displayValue, 36, y + 23);
        ctx.strokeStyle = "#39435e";
        ctx.beginPath();
        ctx.moveTo(36, y + 35);
        ctx.lineTo(310, y + 35);
        ctx.stroke();
      });

      const qrImage = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Could not load QR code"));
        image.src = qrSrc;
      });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(366, 154, 160, 160);
      ctx.drawImage(qrImage, 371, 159, 150, 150);
      ctx.fillStyle = "#c9d3ea";
      ctx.textAlign = "center";
      ctx.font = "12px Arial, sans-serif";
      ctx.fillText("Scan to open booking status", 446, 334);

      ctx.strokeStyle = "#39435e";
      ctx.beginPath();
      ctx.moveTo(36, 390);
      ctx.lineTo(524, 390);
      ctx.stroke();
      ctx.textAlign = "left";
      ctx.fillStyle = "#8e9ab8";
      ctx.font = "11px Arial, sans-serif";
      ctx.fillText(
        "Status updates are online. Phone verification is required.",
        36,
        412,
      );

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Could not export ticket image");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shadow-arena-${booking.ref}-booking.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Could not download the booking pass. Please try again.");
    }
  }

  return (
    <>
      {qrSrc && (
        <div className="ticket-qr">
          <img src={qrSrc} alt="QR code to open this booking status" />
          <span>Scan to open booking status</span>
        </div>
      )}
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      <div className="booking-actions ticket-actions">
        <button
          className="btn"
          type="button"
          disabled={!qrSrc}
          onClick={downloadTicketPng}
        >
          Download booking pass PNG
        </button>
        <button
          className="btn ghost"
          type="button"
          disabled={!qrSrc}
          onClick={downloadQrPng}
        >
          Download QR code PNG
        </button>
      </div>
    </>
  );
}
