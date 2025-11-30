// components/EncryptionTest.jsx
import { useState } from "react";
import EncryptionService from "../utils/encryption";

const EncryptionTest = () => {
  const [originalMessage, setOriginalMessage] = useState("");
  const [channelId, setChannelId] = useState("test-channel-123");
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [decryptedMessage, setDecryptedMessage] = useState("");

  const handleEncrypt = () => {
    const encrypted = EncryptionService.encryptMessage(
      originalMessage,
      channelId
    );
    setEncryptedMessage(encrypted);
  };

  const handleDecrypt = () => {
    const decrypted = EncryptionService.decryptMessage(
      encryptedMessage,
      channelId
    );
    setDecryptedMessage(decrypted);
  };

  return (
    <div className="p-4 border rounded-lg m-4">
      <h3 className="text-lg font-bold mb-4">Encryption Test</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Channel ID:</label>
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Original Message:</label>
          <input
            type="text"
            value={originalMessage}
            onChange={(e) => setOriginalMessage(e.target.value)}
            placeholder="Enter message to encrypt..."
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleEncrypt}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            🔐 Encrypt
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Encrypted Message:
          </label>
          <textarea
            value={encryptedMessage}
            onChange={(e) => setEncryptedMessage(e.target.value)}
            className="w-full p-2 border rounded h-20"
            readOnly
          />
          <button
            onClick={handleDecrypt}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
          >
            🔓 Decrypt
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Decrypted Message:
          </label>
          <input
            type="text"
            value={decryptedMessage}
            className="w-full p-2 border rounded"
            readOnly
          />
        </div>

        <div className="text-sm">
          <p>
            <strong>Match:</strong>{" "}
            {originalMessage === decryptedMessage ? "Success" : "Failed"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EncryptionTest;
