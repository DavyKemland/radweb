import { DataProviderFactory, DataProvider, RowsOfDataForTesting } from "./dataInterfaces1";
import { Entity, SQLConnectionProvider, SQLCommand, Column, SQLQueryResult, DateTimeColumn, DateColumn, BoolColumn, NumberColumn, ClosedListColumn } from "./utils";
import { ActualSQLServerDataProvider } from "./SQLDatabaseShared";

export class WebSqlDataProvider implements DataProviderFactory, RowsOfDataForTesting {
    /** @internal */
    db: Database;

    getRows(tableName: string): Promise<any[]> {
        return new Promise<any[]>((res) => {
            let r = [];
            this.db.readTransaction(
                t => {
                    t.executeSql("select * from " + tableName, null,
                        (t1, rs) => {
                            for (let index = 0; index < rs.rows.length; index++) {
                                r.push(rs.rows[index]);
                            }
                            res(r);
                        })
                }
            )
        });
    }

    setRows(tableName: string, rows: any[]) {
        this.db.transaction(t => {
            t.executeSql("delete from " + tableName);
            rows.forEach(row => {
                let columnNames = [];
                let values = [];
                for (const key in row) {
                    if (row.hasOwnProperty(key)) {
                        columnNames.push(key);
                        values.push(row[key]);
                    }
                }
                t.executeSql("insert into " + tableName + "(" + columnNames.join(",") + ")" + " values (" + values.join(",") + ")");
            });
        })
    }

    constructor(private databaseName: string) {
        this.db = window.openDatabase(databaseName, '1.0', databaseName, 2 * 1024 * 1024);
    }
    provideFor<T extends Entity<any>>(name: string, factory: () => T): DataProvider {

        return new ActualSQLServerDataProvider(() => {
            var e = factory();
            let result = '';
            e.__iterateColumns().forEach(x => {
                if (!x.__dbReadOnly()) {
                    if (result.length != 0)
                        result += ',';
                    result += '\r\n  ';
                    result += this.addColumnSqlSyntax(x);
                    if (x == e.__idColumn)
                        result += ' primary key';
                }
            });
            this.db.transaction(t => t.executeSql('create table if not exists ' + e.__getDbName() + ' (' + result + '\r\n)'));
            return e;
        }, name, new WebSqlBridgeToSQLConnection(this.db), factory);
    }

    private addColumnSqlSyntax(x: Column<any>) {
        let result = x.__getDbName();
        if (x instanceof DateTimeColumn)
            result += " integer";
        else if (x instanceof DateColumn)
            result += " integer";
        else if (x instanceof BoolColumn)
            result += " integer default 0 not null";
        else if (x instanceof NumberColumn) {
            if (x.__numOfDecimalDigits == 0)
                result += " integer default 0 not null";
            else
                result += ' real default 0 not null';
        } else if (x instanceof ClosedListColumn) {
            result += ' integer default 0 not null';
        }
        else
            result += " text default '' not null ";
        return result;
    }

    toString() { return "WebSqlDataProvider" }
}

class WebSqlBridgeToSQLConnection implements SQLConnectionProvider {
    constructor(private source: Database) {
    }
    createCommand(): SQLCommand {
        return new WebSqlBridgeToSQLCommand(this.source);
    }
}

class WebSqlBridgeToSQLCommand implements SQLCommand {
    constructor(private source: Database) {
    }
    values: any[] = [];
    addParameterToCommandAndReturnParameterName(col: Column<any>, val: any): string {
        this.values.push(val);
        return '~' + this.values.length + '~';
    }
    query(sql: string): Promise<SQLQueryResult> {
        return new Promise((resolve, reject) =>
            this.source.transaction(t => {
                let s = sql;
                let v: any[] = [];
                var m = s.match(/~\d+~/g);
                if (m != null)
                    m.forEach(mr => {
                        s = s.replace(mr, '?');
                        v.push(this.values[Number.parseInt(mr.substring(1, mr.length - 1)) - 1]);
                    })
                t.executeSql(s, v, (t1, r) => resolve(new WebSqlBridgeToSQLQueryResult(r)),
                    (t2, err) => {
                        reject(err.message);
                        return undefined;
                    });
            }));
    }
}

class WebSqlBridgeToSQLQueryResult implements SQLQueryResult {
    getcolumnNameAtIndex(index: number): string {
        return undefined;
    }
    getColumnIndex(name: string): number {
        if (this.rows.length == 0) return -1;
        let i = 0;
        for (let m in this.rows[0]) {
            if (m == name) return i;
            i++;
        }
        return -1;
    }
    constructor(private r: SQLResultSet) {
        this.rows = [];
        for (let i = 0; i < r.rows.length; i++) {
            this.rows.push(r.rows.item(i))
        }
    }
    rows: any[];

}