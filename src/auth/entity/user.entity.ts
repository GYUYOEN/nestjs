import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserAuthority } from "./user-authority.entity";
import { Exclude } from "class-transformer";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    password: string;

    @OneToMany(type=>UserAuthority, UserAuthority=>UserAuthority.user, {eager: true})
    authorities?: any[];

    @Column({ nullable: true })
    currentRefreshToken: string;

    @Column({ type: 'datetime', nullable: true })
    currentRefreshTokenExp: Date;
}