let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => ioInstance;

export const emitRefresh = () => {
  if (ioInstance) {
    ioInstance.emit("refreshEvents");
  } else {
    console.warn("[Socket] IO instance not set, cannot emit refresh");
  }
};
