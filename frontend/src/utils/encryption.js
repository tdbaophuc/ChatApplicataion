import CryptoJS from "crypto-js";

class EncryptionService {
  constructor() {
    this.secretKey = this.generateSecretKey();
  }

  generateSecretKey() {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  }

  encryptMessage(message, channelId) {
    try {
      const encrypted = CryptoJS.AES.encrypt(message, channelId).toString();
      return encrypted;
    } catch (error) {
      console.error("Encryption failed:", error);
      return message;
    }
  }

  decryptMessage(encryptedMessage, channelId) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage, channelId);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error("Decryption failed:", error);
      return encryptedMessage;
    }
  }
}

export default new EncryptionService();
