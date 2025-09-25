export interface CacheLock {
    key: string; // varchar(255), unique key for the cache lock
    owner: string; // varchar(255), identifier of the owner of the lock
    expiration: string; // timestamp, nullable, the expiration time for the cache lock
  }
  