// Credit to https://github.com/alvesjtiago/blockstack-large-storage

import toArrayBuffer from 'to-array-buffer';

declare var blockstack;

export default class LargeStorageService {
  private prefix = 'multifile:';

  private processFile(path: string, content: any, options?: any) {
    // Calculate array buffer size in MB
    const arrayBuffer = toArrayBuffer(content);
    const mb = arrayBuffer.byteLength / 1000000.0;
    // Adjust the MB cap according to encryption
    const processedOptions = options || {};
    const mbCap =
      processedOptions.encrypt === true || processedOptions.encrypt == null
        ? 4
        : 5;

    // If the size of the buffer is larger than the cap, chunk file
    if (mb > mbCap) {
      return new Promise((resolve, reject) => {
        const array = new Uint8Array(arrayBuffer);

        let chunkSize = 4000000;
        if (
          processedOptions.encrypt === true ||
          processedOptions.encrypt == null
        ) {
          chunkSize = 2500000;
        }
        const arrayOfFilesBytes = this.chunkArray(array, chunkSize);

        // Write main file
        let paths = '';
        arrayOfFilesBytes.forEach(index => {
          const newPath = `${path}_part${index}`;
          paths = `${paths}${newPath},`;
        });
        const mainContent = this.prefix + paths;
        blockstack.putFile(path, mainContent, options);

        // Write file parts
        const promises = [];
        arrayOfFilesBytes.forEach((element, index) => {
          const newPath = `${path}_part${index}`;
          promises.push(blockstack.putFile(newPath, element, options));
        });
        Promise.all(promises)
          .then(() => {
            resolve();
          })
          .catch(() => {
            reject();
          });
      });
    }

    // Default return of blockstack's putFile if file is smaller than cap size
    if (typeof content === 'string') {
      return blockstack.putFile(path, content, processedOptions);
    }
    return blockstack.putFile(path, arrayBuffer, processedOptions);
  }

  private appendBuffer(buffer1: any, buffer2: any): any {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
  }

  private chunkArray(myArray: any, chunkSize: any): any {
    let index = 0;
    const arrayLength = myArray.length;
    const tempArray = [];

    for (index = 0; index < arrayLength; index += chunkSize) {
      const chunk = myArray.slice(index, index + chunkSize);
      tempArray.push(chunk);
    }

    return tempArray;
  }

  /**
   * Write files to blockstack storage regardless of size
   * @param path - the path to store the data in
   * @param  - the data to store in the file
   * @param [options=null] - options object
   * @param Boolean [options.encrypt=true] - encrypt the data with the app private key
   * @return that resolves if the operation succeed and rejects if it failed
   */
  writeFile(
    path: string,
    content: string | Buffer | File,
    options?: any
  ): Promise<any> {
    if (typeof window !== 'undefined') {
      if (content instanceof File || content instanceof Blob) {
        const reader = new FileReader();
        return new Promise(resolve => {
          reader.onload = () => {
            const arrayBuffer = reader.result;
            resolve(this.processFile(path, arrayBuffer, options));
          };
          reader.readAsArrayBuffer(content);
        });
      }

      return this.processFile(path, content, options);
    }

    return this.processFile(path, content, options);
  }

  /**
   * Retrieves the specified file from the app's data store and aggregates
   * if multifile file is found
   * @param path - the path to the file to read
   * @param [options=null] - options object
   * @param [options.decrypt=true] - try to decrypt the data with the app private key
   * @param options.username - the Blockstack ID to lookup for multi-player storage
   * @param options.app - the app to lookup for multi-player storage -
   * defaults to current origin
   * @param [options.zoneFileLookupURL=null] - The URL
   * to use for zonefile lookup. If falsey, this will use the
   * blockstack.js's getNameInfo function instead.
   * @returns that resolves to the raw data in the file
   * or rejects with an error
   */
  readFile(path: string, options?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      blockstack
        .getFile(path, options)
        .then(file => {
          if (typeof file === 'string') {
            const fileString = String(file);
            if (
              fileString.length > 10 &&
              fileString.substring(0, 10) === this.prefix
            ) {
              // Get file parts
              let fileNames = fileString
                .substring(10, fileString.length)
                .split(',');
              fileNames = fileNames.filter(e => e);
              const promises = [];
              fileNames.forEach(element => {
                promises.push(blockstack.getFile(element, options));
              });
              Promise.all(promises).then(values => {
                let totalBytes = values[0];
                values.forEach((element, index) => {
                  if (index !== 0) {
                    totalBytes = this.appendBuffer(totalBytes, element);
                  }
                });
                resolve(totalBytes);
              });
            } else {
              resolve(file);
            }
          } else {
            resolve(file);
          }
        })
        .catch(() => {
          reject();
        });
    });
  }
}
