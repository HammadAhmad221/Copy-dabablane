export interface Cache {
    key: string; // varchar(255), unique key for the cache item
    value: string; // varchar(255), value of the cache item (typically stored as a string or serialized data)
    expiration: string ; // timestamp, nullable, the expiration time for the cache item
  }
  