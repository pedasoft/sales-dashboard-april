insert into sales_managers (name)
values ('Ali Yılmaz'), ('Ayşe Demir')
on conflict do nothing;

insert into product_managers (name)
values ('Murat Kaya'), ('Elif Aydın')
on conflict do nothing;
