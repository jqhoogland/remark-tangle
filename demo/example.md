> When you eat :t[3 cookies]{cookies=[0..100]}, you consume **:t[150 calories]{calories}**. That's :t[percent]{daily_percent margin-right=0.5ch} of your recommended daily calories.


- ::t[3 cookies]{cookies}
- ::t[50 calories]{calories_per_cookie=[10..100;5]}
- ::t[150 calories]{calories=calories_per_cookie*cookies}
- ::t[2000 calories]{calories_per_day=[0..10000;100]}
- ::t[percent]{daily_percent=calories/calories_per_day}
