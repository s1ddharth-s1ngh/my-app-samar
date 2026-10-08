# Modello Dati - Samar

## Relazioni Principali

```text
[Settings] (Singolo)

[Cycle] 1 -- * [Allocation]
  |              |
  |              * -- 1 [Bucket]
  |                       |
  * --------------------- * [Transaction]
  |                       |
  * -- * [IncomeEntry]    |
             |            |
[IncomeSource] 1 ---------+

[RecurringExpense] * -- 1 [Bucket]

[Project] 1 -- * [Task]
                   |
                   * -- * [TaskOccurrence]
                   |         |
                   |         * -- * [TimerSession]
                   |
                   * -- 1 [ShoppingItem] (opzionale)
                              |
                              * -- 1 [Bucket]
                              |
                              * -- 1 [Cycle]

[Task] 1 -- * [ScheduledNotification]
[ShoppingItem] 1 -- * [ScheduledNotification]
```
