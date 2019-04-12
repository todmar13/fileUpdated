
--------------
fileUpdated.js module and class (currently for json data)
* Caches file in memory but Reads latest version of file
* Returns latest data in file.  Query the value of a json tag name.
* Write new json tag:value data into file
* Read updated version of file.  Checks filetime and re-loads file if current file time is > previous (cached) file time.
--------------

--------------


| Method | Description |
| --- | --- |
| setvalue(name,newvalue) | Update a json value, write to file. |
| makevalue(name,newvalue) | Create a json name:value that can be used as a tag in another value. |
|    | it won't be written in the file, until it is saved in some object value by 'setvalue(name,newvalue)' |
| makevalues( { "(string of json name:value,name:value...)" } ) | Create json to use in another tag |
| getFileAll() | Return all json parsed from file |

-----------------------------
